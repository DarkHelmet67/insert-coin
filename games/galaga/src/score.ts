/*
 * `f_0ECA` and `c_0F0B`: the hit counters become points. Each palette has its value in the
 * table `d_scoreman_inc_lut`, two BCD digits for tens and hundreds; counter 15 carries the
 * bonuses, in hundreds.
 */
import { SCORE_STEPS } from './rom/main-rom';

/** Counters of hits by palette, all zero. */
export const NO_HITS: readonly number[] = Array.from({ length: 16 }, () => 0);

/** Points of one hit of palette `color`: the table is read backwards. */
export const pointsOf = (color: number): number => {
  const step = SCORE_STEPS[15 - color] ?? 0;
  return (step & 0x0f) * 10 + (step >> 4) * 100;
};

/** The points of all the counted hits. */
export const hitPoints = (counts: readonly number[]): number =>
  counts.reduce((sum, n, color) => sum + n * pointsOf(color), 0);
