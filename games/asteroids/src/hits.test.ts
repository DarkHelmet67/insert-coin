import { describe, expect, it } from 'vitest';
import { resolveHits, type HitState } from './hits';
import { seedRandom } from './random';
import { noRocks, type Rock } from './rocks';
import { noSaucer, type Saucer } from './saucer';
import { newShip } from './ship';
import { noShots, type Shot } from './shots';

const ROCK: Rock = {
  kind: 'rock',
  position: { x: 4000, y: 3000 },
  vx: 10,
  vy: 10,
  size: 4,
  shape: 0,
};
const SHOT: Shot = { position: { x: 4100, y: 3000 }, vx: 60, vy: 0, life: 10 };

const state: HitState = {
  shots: noShots.map((shot, i) => (i === 3 ? SHOT : shot)),
  rocks: noRocks.map((slot, i) => (i === 26 ? ROCK : slot)),
  score: 0,
  rng: seedRandom(9),
  // The ship far from everything, bottom left.
  ship: { ...newShip, position: { x: 500, y: 500 } },
  life: { kind: 'flying' },
  lives: 3,
  ...noSaucer,
};

describe('resolveHits', () => {
  it('breaks the rock, removes the shot and scores', () => {
    const next = resolveHits(state);
    expect(next.shots).toEqual(noShots);
    expect(next.rocks[26]?.kind).toBe('explosion');
    expect(next.rocks.filter((slot) => slot?.kind === 'rock')).toHaveLength(2);
    expect(next.score).toBe(20);
  });

  it('lets a shot fly on when it misses', () => {
    const far = {
      ...state,
      shots: state.shots.map((shot) => shot && { ...shot, position: { x: 100, y: 100 } }),
    };
    expect(resolveHits(far)).toEqual(far);
  });

  it('lets a second shot in the same spot hit a child rock, not the explosion', () => {
    const twoShots = { ...state, shots: [null, null, SHOT, SHOT] };
    const next = resolveHits(twoShots);
    expect(next.shots.filter(Boolean)).toHaveLength(0);
    expect(next.score).toBe(20 + 50);
  });

  it('gives an extra ship at 10,000 points', () => {
    expect(resolveHits({ ...state, score: 9990 }).lives).toBe(4);
  });

  it('lets a shot destroy its own ship, before any rock and with no points', () => {
    const ownShot = { ...state, ship: { ...state.ship, position: SHOT.position } };
    const next = resolveHits(ownShot);
    expect(next.life.kind).toBe('exploding');
    expect(next.lives).toBe(2);
    expect(next.rocks[26]?.kind).toBe('rock');
    expect(next.score).toBe(0);
  });

  it('destroys ship and rock when they meet, and scores the rock', () => {
    const crash = {
      ...state,
      shots: noShots,
      ship: { ...state.ship, position: { x: 4000 - 300, y: 3000 } },
    };
    const next = resolveHits(crash);
    expect(next.life.kind).toBe('exploding');
    expect(next.rocks[26]?.kind).toBe('explosion');
    expect(next.score).toBe(20);
  });

  it('lets a hidden ship pass through rocks', () => {
    const hidden = {
      ...state,
      shots: noShots,
      ship: { ...state.ship, position: ROCK.position },
      life: { kind: 'hidden', timer: 10, reason: 'jump' } as const,
    };
    expect(resolveHits(hidden)).toEqual(hidden);
  });

  const SAUCER: Saucer = {
    kind: 'saucer',
    position: { x: 6000, y: 1000 },
    vx: 16,
    vy: 0,
    size: 'small',
  };

  it('gives 1000 points for the small saucer and 200 for the large one', () => {
    const shotAtSaucer = {
      ...state,
      saucer: SAUCER,
      shots: noShots.map((shot, i) => (i === 3 ? { ...SHOT, position: SAUCER.position } : shot)),
    };
    const small = resolveHits(shotAtSaucer);
    expect(small.saucer).toMatchObject({ kind: 'explosion', status: 0xa0 });
    expect(small.score).toBe(1000);
    expect(resolveHits({ ...shotAtSaucer, saucer: { ...SAUCER, size: 'large' } }).score).toBe(200);
  });

  it("lets the saucer's shots destroy the ship", () => {
    const saucerShot = { ...SHOT, position: state.ship.position };
    const next = resolveHits({ ...state, shots: noShots, saucerShots: [null, saucerShot] });
    expect(next.life.kind).toBe('exploding');
    expect(next.saucerShots).toEqual([null, null]);
  });

  it("breaks rocks with the saucer's shots, for no points", () => {
    const next = resolveHits({ ...state, shots: noShots, saucerShots: [SHOT, null] });
    expect(next.rocks[26]?.kind).toBe('explosion');
    expect(next.score).toBe(0);
    expect(next.rockHitTimer).toBe(0x50);
  });

  it('gives the saucer points when it runs into the ship, and none when it hits a rock', () => {
    const crash = resolveHits({
      ...state,
      shots: noShots,
      saucer: { ...SAUCER, position: state.ship.position },
    });
    expect(crash.life.kind).toBe('exploding');
    expect(crash.saucer?.kind).toBe('explosion');
    expect(crash.score).toBe(1000);
    const intoRock = resolveHits({
      ...state,
      shots: noShots,
      saucer: { ...SAUCER, position: ROCK.position },
    });
    expect(intoRock.saucer?.kind).toBe('explosion');
    expect(intoRock.rocks[26]?.kind).toBe('explosion');
    expect(intoRock.score).toBe(0);
  });
});
