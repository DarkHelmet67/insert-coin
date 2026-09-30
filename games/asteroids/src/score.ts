import type { RockSize } from './rocks';

/** Points for a rock [P $7659]: the smaller, the more it is worth. */
export const ROCK_POINTS: Readonly<Record<RockSize, number>> = { 4: 20, 2: 50, 1: 100 };

/**
 * Adds points to a score. The cabinet counts up to 99,990 and then starts again from 0
 * [P $7397]: four digits of tens plus a fixed zero.
 */
export const addPoints = (score: number, points: number): number => (score + points) % 100000;
