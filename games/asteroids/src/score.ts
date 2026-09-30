import type { RockSize } from './rocks';

/** Points for a rock [P $7659]: the smaller, the more it is worth. */
export const ROCK_POINTS: Readonly<Record<RockSize, number>> = { 4: 20, 2: 50, 1: 100 };

/**
 * Adds points to a score. The cabinet counts up to 99,990 and then starts again from 0
 * [P $7397]: four digits of tens plus a fixed zero.
 */
export const addPoints = (score: number, points: number): number => (score + points) % 100000;

/** Points for an extra ship [P $7397]: one every 10,000, with no limit. */
export const EXTRA_LIFE_POINTS = 10000;

/**
 * Whether going from `before` to `after` earns an extra ship. The program checks it when the
 * thousands digit rolls over to 0, so the wrap from 99,990 back to 0 earns one too.
 */
export const earnsExtraLife = (before: number, after: number): boolean =>
  Math.floor(before / EXTRA_LIFE_POINTS) !== Math.floor(after / EXTRA_LIFE_POINTS);
