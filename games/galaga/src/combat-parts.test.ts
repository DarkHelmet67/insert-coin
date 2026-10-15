import { describe, expect, it } from 'vitest';
import { bomberSettings, continuousBombing } from './bomber-timers';
import { BOMB_CODE, moveBombs, setUpBombs } from './bombs';
import { newAttacks } from './attacks';
import { NO_CAPTURE } from './capture-state';
import { detectHits, startExplosions, type HitWorld } from './hits';
import { DISPOSITION, emptyObjects, FIGHTER, FIRST_BOMB, objectAt, updateObject } from './objects';
import { hitPoints, NO_HITS, pointsOf } from './score';
import { BOMB_ENABLE_TABLE } from './rom/main-rom';
import { RANK, challengeBonus, stageParameters } from './stage-setup';

describe('bomber settings', () => {
  const params = stageParameters(1, RANK.A);

  it('attack nonstop with few aliens left, while the fighter can fire', () => {
    expect(continuousBombing(params, params.continuousBombing - 1, true)).toBe(true);
    expect(continuousBombing(params, params.continuousBombing - 1, false)).toBe(false);
    expect(bomberSettings(params, 3, 100, true, 2).reload).toEqual([2, 2, 2]);
  });

  it('let more aliens attack after the first 30 seconds', () => {
    expect(bomberSettings(params, 40, 0x78, false, 1).maxBombers).toBe(1);
    expect(bomberSettings(params, 40, 0x3b, false, 1).maxBombers).toBe(params.maxBombersLater);
  });

  it('read past the row with all 40 aliens alive, as the original does (c_08BE)', () => {
    const settings = bomberSettings(params, 40, 0x78, false, 1);
    // Column 4 is the first byte of the next row: $093c + 4 for the Boss, $091c + 4 for bombs.
    expect(settings.reload[0]).toBe(BOMB_ENABLE_TABLE[32 + params.bossTimer * 4 + 4]);
    expect(settings.bombBits).toBe(BOMB_ENABLE_TABLE[params.bombEnable * 4 + 4]);
    expect(bomberSettings(params, 39, 0x78, false, 1).reload[0]).toBe(
      BOMB_ENABLE_TABLE[32 + params.bossTimer * 4 + 3],
    );
  });
});

describe('bombs', () => {
  it('fall 2 and 3 pixels on alternate frames, drifting by the rate', () => {
    const objects = updateObject(setUpBombs(emptyObjects()), FIRST_BOMB, (o) => ({
      ...o,
      x: 100,
      y: 100,
    }));
    const drift = Array.from({ length: 8 }, () => ({ rate: 0x40, accumulator: 0 }));
    const once = moveBombs(objects, drift, 0);
    const twice = moveBombs(once.objects, once.drift, 1);
    expect(objectAt(once.objects, FIRST_BOMB)).toMatchObject({ x: 102, y: 102, code: BOMB_CODE });
    expect(objectAt(twice.objects, FIRST_BOMB)).toMatchObject({ x: 104, y: 105 });
  });
});

describe('score', () => {
  it('values each palette as the ROM table says', () => {
    expect([1, 2, 3, 7, 15].map(pointsOf)).toEqual([150, 80, 50, 500, 100]);
    expect(hitPoints(NO_HITS.map((_, i) => (i === 3 ? 2 : 0)))).toBe(100);
  });
});

/** A world with a bee at (100, 200) and a rocket at (`x`, 200). */
const shotAt = (x: number, disposition: number): HitWorld => ({
  objects: updateObject(
    updateObject(emptyObjects(), 0x08, (o) => ({ ...o, disposition, x: 100, y: 200, color: 3 })),
    0x64,
    (o) => ({ ...o, disposition: DISPOSITION.shot, x, y: 200 }),
  ),
  slots: [],
  hitCounts: NO_HITS,
  rocketHits: 0,
  flyingHits: 0,
  groupLeft: 0,
  attacks: newAttacks(),
  capture: NO_CAPTURE,
  tripleLeft: 0,
  tripleBonus: { hundreds: 0, code: 0 },
  sounds: [],
  fightersHit: [],
});

const hitInputs = {
  dual: false,
  rescueRunning: false,
  wavesEntering: false,
  challengeBonus: challengeBonus(1),
};

describe('hits', () => {
  it('a rocket within 5 pixels hits a resting bee: 50 points, then it explodes', () => {
    const after = detectHits(shotAt(105, DISPOSITION.home), hitInputs, false);
    expect(after.rocketHits).toBe(1);
    expect(objectAt(after.objects, 0x64).x).toBe(0);
    expect(hitPoints(after.hitCounts)).toBe(50);
    expect(after.sounds).toEqual(['beeHit']);
    expect(objectAt(startExplosions(after.objects), 0x08).disposition).toBe(DISPOSITION.exploding);
  });

  it('a flying bee is worth double', () => {
    const after = detectHits(shotAt(100, DISPOSITION.flying), hitInputs, false);
    expect(hitPoints(after.hitCounts)).toBe(100);
    expect(after.flyingHits).toBe(1);
  });

  it('a rocket 6 pixels away misses', () => {
    expect(detectHits(shotAt(106, DISPOSITION.home), hitInputs, false).rocketHits).toBe(0);
  });

  it('a bomb on the fighter destroys it and disappears', () => {
    const objects = updateObject(
      updateObject(emptyObjects(), FIGHTER, (o) => ({ ...o, disposition: 1, x: 120, y: 300 })),
      FIRST_BOMB,
      (o) => ({ ...o, disposition: DISPOSITION.shot, x: 124, y: 302, color: 0x0b }),
    );
    const after = detectHits({ ...shotAt(0, 0), objects }, hitInputs, true);
    expect(after.fightersHit).toEqual([FIGHTER]);
    expect(objectAt(after.objects, FIRST_BOMB).x).toBe(0);
  });
});
