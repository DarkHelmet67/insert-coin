import { FIELD_HEIGHT, movePoint, type Point } from './position';
import { nextRandom, nextRandomAfter, smallSigned, type Rng } from './random';

/** Rock sizes as the program stores them [P $71A2]: halving gives the next smaller size. */
export type RockSize = 4 | 2 | 1;

/** A flying rock. */
export interface Rock {
  readonly kind: 'rock';
  readonly position: Point;
  /** Velocity in position units per frame: 6 to 31 on each axis, in either direction. */
  readonly vx: number;
  readonly vy: number;
  readonly size: RockSize;
  /** Which of the four ROM outlines, 0-3. */
  readonly shape: number;
}

/**
 * A rock that has been hit: the slot shows a cloud of shrapnel while `status` climbs from $A0
 * past $FF, about 37 frames [P $6F62]. It still counts as a rock until it ends.
 */
export interface RockExplosion {
  readonly kind: 'explosion';
  readonly position: Point;
  readonly status: number;
}

/** One of the 27 rock slots of the program [P $0200]: a rock, an explosion or free (`null`). */
export type RockSlot = Rock | RockExplosion | null;

/** Number of rock slots: when they are all taken, a hit rock breaks without children. */
export const ROCK_SLOTS = 27;

/** All the slots free. */
export const noRocks: readonly RockSlot[] = Array.from({ length: ROCK_SLOTS }, () => null);

/** The status an explosion starts from [P $6B58]. */
export const EXPLOSION_START = 0xa0;

/** Rocks and explosions still on screen: the next wave waits until there are none. */
export const rockCount = (slots: readonly RockSlot[]): number => slots.filter(Boolean).length;

/**
 * Keeps a rock speed away from zero and below 32 [P $7233]: -31..-6 or 6..31. A rock never
 * stands still and never flies faster than a shot can follow.
 */
export const clampRockSpeed = (speed: number): number =>
  speed < 0 ? Math.max(-31, Math.min(-6, speed)) : Math.max(6, Math.min(31, speed));

/** A velocity drawn around a parent's [P $7203]: one draw for x, the fifth after it for y. */
export const randomVelocity = (
  rng: Rng,
  parentVx: number,
  parentVy: number,
): { readonly vx: number; readonly vy: number; readonly rng: Rng } => {
  const x = nextRandom(rng);
  const y = nextRandomAfter(x.rng, 4);
  return {
    vx: clampRockSpeed(parentVx + smallSigned(x.value)),
    vy: clampRockSpeed(parentVy + smallSigned(y.value)),
    rng: y.rng,
  };
};

/** Shape bits of a random byte [P $71A0]: bits 3 and 4, one of the four outlines. */
export const randomShape = (value: number): number => (value & 0x18) >> 3;

/**
 * Where a new large rock enters [P $71AA]: bit 0 of a random byte picks the bottom edge (random
 * x) or the left edge (random y). Since the playfield wraps, rocks seem to come from every side.
 * The program leaves the other coordinate's low byte as it was in the slot; the remake uses 0.
 */
export const entryPoint = (value: number): Point => {
  const high = (value >> 1) & 0x1f;
  if ((value & 1) === 0) return { x: high << 8, y: 0 };
  const y = high >= FIELD_HEIGHT >> 8 ? high & 0x17 : high;
  return { x: 0, y: y << 8 };
};

/** A new large rock at the edge of the playfield, with a random outline and velocity. */
export const newLargeRock = (rng: Rng): { readonly rock: Rock; readonly rng: Rng } => {
  const shape = nextRandom(rng);
  const velocity = randomVelocity(shape.rng, 0, 0);
  const place = nextRandom(velocity.rng);
  return {
    rock: {
      kind: 'rock',
      position: entryPoint(place.value),
      vx: velocity.vx,
      vy: velocity.vy,
      size: 4,
      shape: randomShape(shape.value),
    },
    rng: place.rng,
  };
};

/** Large rocks in a wave [P $7187]: 4, 6, 8, 10, then always 11. */
export const nextWaveSize = (previous: number): number => Math.min(11, previous + 2);

/**
 * A new wave: `count` large rocks in the last slots, every other slot free [P $7187-$71E7].
 */
export const spawnWave = (
  count: number,
  rng: Rng,
): { readonly slots: readonly RockSlot[]; readonly rng: Rng } =>
  Array.from({ length: count }).reduce<{ readonly slots: readonly RockSlot[]; readonly rng: Rng }>(
    ({ slots, rng: current }, _, index) => {
      const { rock, rng: next } = newLargeRock(current);
      const slot = ROCK_SLOTS - 1 - index;
      return { slots: slots.map((old, i) => (i === slot ? rock : old)), rng: next };
    },
    { slots: noRocks, rng },
  );

/**
 * One frame of an explosion of a rock or a saucer: it grows by about 1/16 of what it has left
 * until it passes $FF, then it is over and frees the slot [P $6F62].
 */
export const growExplosion = (explosion: RockExplosion): RockExplosion | null => {
  const status = explosion.status + ((256 - explosion.status) >> 4) + 1;
  return status > 0xff ? null : { ...explosion, status };
};

/** One frame of a slot: a rock moves and wraps, an explosion grows. */
export const updateRockSlot = (slot: RockSlot): RockSlot => {
  if (!slot) return null;
  if (slot.kind === 'rock')
    return { ...slot, position: movePoint(slot.position, slot.vx, slot.vy) };
  return growExplosion(slot);
};
