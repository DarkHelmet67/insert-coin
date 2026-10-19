import type { TouchControlsSettings } from '@arcade/input';
import type { SpaceInvadersDebug } from './debug';

/**
 * The values of the remake that are a choice rather than a fact of the original, in one place
 * so they are easy to change and to test. The colours have their own file, colors.config.ts;
 * values that are certain (the ROM drawings, the start heights of the rounds) live in the
 * modules that use them.
 * - [N] our choice, where the sources say nothing or the browser asks for something else.
 */

/**
 * Debug mode [N], to test the advanced rounds without playing well. Turn it on with
 * `enabled: true`; while it is on, the DEBUG mark is shown and the hi-score is not saved.
 * Keep `enabled: false` in the published game: a test fails otherwise. See
 * docs/18-modalita-debug.md.
 */
const debug: SpaceInvadersDebug = {
  enabled: false,
  /** The first round: from the 9th on, the start heights repeat (60 50 48 48 48 40 40 40). */
  startLevel: 1,
  /** Bombs do not destroy the cannon and invaders that land start their round again. */
  godMode: true,
  /** Shots, bombs and invaders leave the shields intact. */
  noShieldDamage: false,
};

export const tuning = {
  debug,
  /**
   * The controls on touch screens [N]: `movement` is `'joystick'` (a virtual joystick where the
   * arrow buttons were, moving the cannon) or `'arrows'` (the arrow buttons). `deadZone` is
   * the part of the joystick's push, from 0 to 1, that does not move anything yet.
   */
  touchControls: { movement: 'joystick', deadZone: 0.3 } satisfies TouchControlsSettings,
} as const;
