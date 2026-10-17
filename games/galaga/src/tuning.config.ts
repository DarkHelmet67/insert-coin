/**
 * The values of the remake that the sources do not fix for certain, or that the cabinet lets
 * the owner choose, in one place so they are easy to change and to test. Each value says where
 * it comes from:
 * - [P] read in the program of the main or sub processor, with the label of its commented source;
 * - [S] read in the program of the sound processor;
 * - [R] read in the ROMs;
 * - [H] from the hardware, through MAME;
 * - [W] from written sources (manuals, articles);
 * - [N] our choice, where the sources say nothing or the browser asks for something else.
 * See docs/meccaniche-originali.md for the details.
 */
import type { NoiseSound } from '@arcade/audio';
import type { TouchControlsSettings } from '@arcade/input';
import type { GalagaDebug } from './debug';
import { RANK, type Rank } from './stage-setup';

/**
 * Debug mode [N], to test the late stages and the challenging stages without playing well.
 * Turn it on with `enabled: true`; while it is on, the DEBUG mark is shown and the hi-score is
 * not saved. Keep `enabled: false` in the published game: a test fails otherwise. See
 * docs/18-modalita-debug.md.
 */
const debug: GalagaDebug = {
  enabled: false,
  /** The first stage: 3, 7, 11... are challenging stages; past stage 26 the last four repeat. */
  startLevel: 1,
  /** Bombs and aliens do not destroy the fighter (aliens that touch it still explode). */
  godMode: true,
  /** The tractor beam never catches the fighter. */
  noCapture: false,
  /** Every new fighter arrives as a double fighter, which no Boss can capture. */
  startDual: false,
};

export const tuning = {
  debug,
  /**
   * The difficulty (DIP switches): A is the factory setting [W manual], the easiest; B, C and D
   * make the aliens dive and bomb more [P `bmbr_stg_cfg_dat`].
   */
  rank: RANK.A as Rank,

  /** Fighters in reserve at the start: 3 fighters in all, the factory setting [W manual]. */
  reserve: 2,

  /**
   * Extra fighters, in tens of thousands of points: the first at 20 000, the second at 70 000,
   * then one every 70 000, the factory setting [W manual, P `gctl_supv_score`].
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
  /**
   * The controls on touch screens [N]: `movement` is `'joystick'` (a virtual joystick where the
   * arrow buttons were, moving the fighter) or `'arrows'` (the arrow buttons). `deadZone` is
   * the part of the joystick's push, from 0 to 1, that does not move anything yet.
   */
  touchControls: { movement: 'joystick', deadZone: 0.3 } satisfies TouchControlsSettings,
} as const;
