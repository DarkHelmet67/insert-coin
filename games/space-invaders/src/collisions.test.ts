import { describe, expect, it } from 'vitest';
import type { Bomb } from './bombs';
import { CANNON_EXPLOSION_FRAMES, CANNON_Y } from './cannon';
import {
  aliensCrushShields,
  awardExtraLife,
  bombsHitCannon,
  bombsHitGround,
  bombsHitShields,
  EXTRA_LIFE_SCORE,
  shotHitsAlien,
  shotHitsShield,
  shotHitsUfo,
} from './collisions';
import { createFleet } from './fleet';
import { GROUND_Y } from './playfield';
import { initialPlayingState, type PlayingState } from './playing';
import { alienAt } from './test-fixtures';
import { UFO_Y } from './ufo';

/** A new game with some fields replaced. */
const game = (changes: Partial<PlayingState>): PlayingState => ({
  ...initialPlayingState(),
  ...changes,
});

/** A game whose only bomb is `bomb`. */
const withBomb = (bomb: Bomb): PlayingState =>
  game({ bombs: { ...initialPlayingState().bombs, active: [bomb] } });

/** Lit pixels left in all the shields. */
const shieldPixels = (state: PlayingState): number =>
  state.shields.flatMap((shield) => shield.bitmap.pixels).filter(Boolean).length;

describe('shot collisions', () => {
  it('destroys the invader hit and scores its points', () => {
    const target = alienAt(100, 100, 'crab');
    const state = game({ fleet: { ...createFleet(), aliens: [target] }, shot: { x: 105, y: 104 } });
    const next = shotHitsAlien(state);
    expect(next).toMatchObject({ score: 20, shot: undefined });
    expect(next.fleet.aliens).toEqual([]);
    expect(next.effects.map((e) => e.kind)).toEqual(['alien']);
  });

  it('misses through the gaps of the invader sprite', () => {
    // The crab's top row is only lit at columns 2 and 8.
    const target = alienAt(100, 100, 'crab');
    const state = game({ fleet: { ...createFleet(), aliens: [target] }, shot: { x: 105, y: 97 } });
    expect(shotHitsAlien(state)).toBe(state);
  });

  it('scores the mystery ship by the number of shots fired', () => {
    const state = game({
      ufo: { countdown: 0, saucer: { x: 100, direction: 1, age: 0 } },
      shot: { x: 108, y: UFO_Y + 2 },
      shotsFired: 23,
    });
    const next = shotHitsUfo(state);
    expect(next.score).toBe(300);
    expect(next.ufo.saucer).toBeUndefined();
    expect(next.effects[0]).toMatchObject({ kind: 'ufo', points: 300 });
  });

  it('stops at a shield, carving a hole in it', () => {
    const state = game({ shot: { x: 40, y: 200 } });
    const next = shotHitsShield(state);
    expect(next.shot).toBeUndefined();
    expect(shieldPixels(next)).toBeLessThan(shieldPixels(state));
  });
});

describe('bomb collisions', () => {
  it('destroys the cannon and costs a life', () => {
    const next = bombsHitCannon(withBomb({ kind: 'rolling', x: 22, y: CANNON_Y - 4, steps: 3 }));
    expect(next).toMatchObject({ lives: 2, cannonExplosion: CANNON_EXPLOSION_FRAMES });
    expect(next.bombs.active).toEqual([]);
  });

  it('carves the shields', () => {
    const state = withBomb({ kind: 'plunger', x: 40, y: 188, steps: 3 });
    const next = bombsHitShields(state);
    expect(next.bombs.active).toEqual([]);
    expect(shieldPixels(next)).toBeLessThan(shieldPixels(state));
  });

  it('explodes on the ground', () => {
    const next = bombsHitGround(withBomb({ kind: 'squiggly', x: 5, y: GROUND_Y - 8, steps: 9 }));
    expect(next.bombs.active).toEqual([]);
    expect(next.effects.map((e) => e.kind)).toEqual(['bomb']);
  });
});

describe('other rules', () => {
  it('lets invaders erase the shields they walk over', () => {
    const state = game({ fleet: { ...createFleet(), aliens: [alienAt(34, 192)] } });
    expect(shieldPixels(aliensCrushShields(state))).toBeLessThan(shieldPixels(state));
  });

  it('awards one extra cannon at 1500 points, only once', () => {
    const rich = awardExtraLife(game({ score: EXTRA_LIFE_SCORE }));
    expect(rich).toMatchObject({ lives: 4, extraLifeAwarded: true });
    expect(awardExtraLife({ ...rich, score: 3000 }).lives).toBe(4);
  });
});
