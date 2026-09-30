import type { Point } from './position';
import type { RockSize } from './rocks';
import type { SaucerSize } from './saucer';

/**
 * The collision test of the 6502 program [P $6A13-$6A8F]: no circles, no rectangles, but an
 * octagon, cheap to compute with 8-bit numbers. Distances are halved to fit in a byte; objects
 * touching across the edge of the playfield do not collide, as in the original.
 */

/**
 * Half the distance between two coordinates as the program computes it, or `undefined` when they
 * are 512 units or more apart. Going left or down it comes out one smaller, because the program
 * inverts the bits instead of negating [P $6A2E].
 */
export const halfDistance = (from: number, to: number): number | undefined => {
  const d = to - from;
  if (d >= 512 || d < -512) return undefined;
  return d >= 0 ? d >> 1 : (-d - 1) >> 1;
};

/** Size of the object being hit [P $6A55]: small rocks and the ship 42, medium 72, large 132. */
export const TARGET_SIZE: Readonly<Record<RockSize, number>> = { 1: 0x2a, 2: 0x48, 4: 0x84 };

/** Size of the ship when something hits it [P $6A55]: the same as a small rock. */
export const SHIP_SIZE = 0x2a;

/** What the ship adds to the size of a rock it runs into [P $6A67]; a shot adds nothing. */
export const SHIP_REACH = 0x1c;

/**
 * Whether an object at `attacker` touches one at `target`: both half distances within `radius`,
 * and their sum within one and a half times it (the octagon's cut corners).
 */
export const collides = (target: Point, attacker: Point, radius: number): boolean => {
  const dx = halfDistance(attacker.x, target.x);
  const dy = halfDistance(attacker.y, target.y);
  if (dx === undefined || dy === undefined) return false;
  return dx <= radius && dy <= radius && dx + dy < radius + (radius >> 1);
};

/** Size of a saucer when something hits it [P $6A55]: like a small or a medium rock. */
export const SAUCER_SIZE: Readonly<Record<SaucerSize, number>> = { small: 0x2a, large: 0x48 };

/** What a saucer adds to the size of what it runs into [P $6A6B]. */
export const SAUCER_REACH: Readonly<Record<SaucerSize, number>> = { small: 19, large: 37 };
