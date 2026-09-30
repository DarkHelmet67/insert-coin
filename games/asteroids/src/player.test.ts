import { describe, expect, it } from 'vitest';
import {
  HYPERSPACE_TIME,
  hyperspaceLanding,
  jumpIntoHyperspace,
  killShip,
  RESPAWN_DELAY,
  spawnIsClear,
  updateExplosion,
  updateHidden,
  waitingToRespawn,
  type PlayerState,
} from './player';
import { nextRandom, seedRandom } from './random';
import { noRocks, type Rock, type RockSlot } from './rocks';
import { newShip, SHIP_START } from './ship';

const flying: PlayerState = {
  ship: { ...newShip, vx: 300, vy: -200, direction: 40 },
  life: { kind: 'flying' },
  lives: 3,
};

/** A large rock at `position`. */
const rockAt = (x: number, y: number): Rock => ({
  kind: 'rock',
  position: { x, y },
  vx: 8,
  vy: 8,
  size: 4,
  shape: 0,
});

/** `count` rocks far from the middle. */
const rocks = (count: number): readonly RockSlot[] =>
  noRocks.map((slot, i) => (i < count ? rockAt(100, 100) : slot));

/** Runs `frames` frames of the explosion. */
const explode = (player: PlayerState, frames: number): PlayerState =>
  Array.from({ length: frames }).reduce<PlayerState>(
    (current, _, frame) => updateExplosion(current, frame),
    player,
  );

describe('killShip', () => {
  it('stops the ship, starts the explosion and takes a life', () => {
    const dead = killShip(flying);
    expect(dead.ship).toMatchObject({ vx: 0, vy: 0, direction: 40 });
    expect(dead.life).toEqual({ kind: 'exploding', status: 0xa0, age: 0 });
    expect(dead.lives).toBe(2);
  });
});

describe('updateExplosion', () => {
  it('lasts 192 frames, then puts the ship back in the middle with its direction', () => {
    const dead = killShip(flying);
    expect(explode(dead, 191).life.kind).toBe('exploding');
    const over = explode(dead, 192);
    expect(over.life).toEqual(waitingToRespawn(RESPAWN_DELAY));
    expect(over.ship.position).toEqual(SHIP_START);
    expect(over.ship.direction).toBe(40);
  });
});

describe('hyperspaceLanding', () => {
  it('lands inside the margins of the screen', () => {
    const landings = Array.from({ length: 200 }, (_, seed) =>
      hyperspaceLanding(SHIP_START, rocks(10), seedRandom(seed * 97)),
    );
    landings.forEach(({ position }) => {
      expect(position.x >> 8).toBeGreaterThanOrEqual(3);
      expect(position.x >> 8).toBeLessThanOrEqual(0x1c);
      expect(position.y >> 8).toBeGreaterThanOrEqual(3);
      expect(position.y >> 8).toBeLessThanOrEqual(0x14);
    });
  });

  it('keeps the low byte of the old position', () => {
    const { position } = hyperspaceLanding({ x: 0x1234, y: 0x0a56 }, noRocks, seedRandom(5));
    expect(position.x & 0xff).toBe(0x34);
    expect(position.y & 0xff).toBe(0x56);
  });

  it('is more dangerous with few rocks: 1 in 4 with 4 rocks, never with 19', () => {
    /** Share of all generator states that make the jump fatal with `count` rocks. */
    const fatal = (count: number): number =>
      // Every possible state of the generator, so the count is exact.
      Array.from({ length: 0x10000 }, (_, seed) => seed).filter(
        (seed) => hyperspaceLanding(SHIP_START, rocks(count), seedRandom(seed)).fatal,
      ).length / 0x10000;
    expect(fatal(4)).toBeCloseTo(0.25, 1);
    expect(fatal(19)).toBe(0);
  });
});

describe('jumpIntoHyperspace', () => {
  it('hides the ship, still, for 48 frames', () => {
    const { player, rng } = jumpIntoHyperspace(flying, rocks(10), seedRandom(3));
    expect(player.life).toMatchObject({ kind: 'hidden', timer: HYPERSPACE_TIME });
    expect(player.ship).toMatchObject({ vx: 0, vy: 0 });
    expect(rng).not.toEqual(nextRandom(seedRandom(3)).rng);
  });
});

describe('updateHidden', () => {
  it('counts the timer down', () => {
    const hidden = { ...flying, life: waitingToRespawn(5) };
    expect(updateHidden(hidden, noRocks).life).toEqual(waitingToRespawn(4));
  });

  it('brings the ship back when the middle is clear, otherwise tries again next frame', () => {
    const hidden = { ...flying, ship: newShip, life: waitingToRespawn(1) };
    expect(updateHidden(hidden, noRocks).life.kind).toBe('flying');
    const blocked = noRocks.map((slot, i) => (i === 0 ? rockAt(0x1200, 0x0d00) : slot));
    expect(updateHidden(hidden, blocked).life).toEqual(waitingToRespawn(1));
  });

  it('ends a jump with no check, or with an explosion when it went wrong', () => {
    const crowded = noRocks.map(() => rockAt(0x1060, 0x0c60));
    const landing = { ...flying, life: { kind: 'hidden', timer: 1, reason: 'jump' } as const };
    expect(updateHidden(landing, crowded).life.kind).toBe('flying');
    const fatal = { ...landing, life: { ...landing.life, reason: 'fatal-jump' } as const };
    expect(updateHidden(fatal, noRocks)).toMatchObject({ life: { kind: 'exploding' }, lives: 2 });
  });
});

describe('spawnIsClear', () => {
  it('looks at a square of 8 × 8 blocks of 256 units around the start', () => {
    expect(spawnIsClear(noRocks)).toBe(true);
    expect(spawnIsClear([rockAt(0x0c00, 0x0c00)])).toBe(false);
    expect(spawnIsClear([rockAt(0x0bff, 0x0c00)])).toBe(true);
    expect(spawnIsClear([rockAt(0x13ff, 0x0fff)])).toBe(false);
    expect(spawnIsClear([rockAt(0x1400, 0x0c00)])).toBe(true);
  });

  it('counts exploding rocks too', () => {
    expect(spawnIsClear([{ kind: 'explosion', position: SHIP_START, status: 0xa0 }])).toBe(false);
  });
});
