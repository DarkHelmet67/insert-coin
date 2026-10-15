/**
 * The values of the remake that the sources do not fix for certain, or that the cabinet lets
 * the owner choose, in one place so they are easy to change and to test. Each value says where
 * it comes from:
 * - [S] read in the original program, with the label of its commented source code;
 * - [R] read in the ROMs;
 * - [H] from the hardware, through MAME;
 * - [W] from written sources (manuals, articles);
 * - [N] our choice, where the sources say nothing or the browser asks for something else.
 * See docs/meccaniche-originali.md for the details.
 */
import type { NoiseSound } from '@arcade/audio';
import { RANK, type Rank } from './stage-setup';

export const tuning = {
  /**
   * The difficulty (DIP switches): A is the factory setting [W manual], the easiest; B, C and D
   * make the aliens dive and bomb more [S `bmbr_stg_cfg_dat`].
   */
  rank: RANK.A as Rank,

  /** Fighters in reserve at the start: 3 fighters in all, the factory setting [W manual]. */
  reserve: 2,

  /**
   * Extra fighters, in tens of thousands of points: the first at 20 000, the second at 70 000,
   * then one every 70 000, the factory setting [W manual, S `gctl_supv_score`].
   */
  extraLives: { first: 2, every: 7 },

  /** Volume of the sound chip's three voices, from 0 to 1 [N]. */
  soundVolume: 0.8,

  /**
   * The explosion of the fighter. On the cabinet it is a noise made by the 54XX chip and
   * shaped by an analog circuit [H `galaga.cpp`], which MAME itself does not fully emulate: a
   * filtered noise that fades in about a second is our approximation [N].
   */
  explosion: {
    kind: 'noise',
    cutoff: 1200,
    duration: 1.1,
    volume: 0.6,
    hold: 0.05,
    fade: 'linear',
  } satisfies NoiseSound,
} as const;
