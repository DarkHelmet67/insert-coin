/**
 * The values of the remake that are meant to be changed by hand, in one place so they are easy
 * to find. Values that are certain (the ROM drawings, the start heights of the rounds) live in
 * the modules that use them instead.
 */
import type { SpaceInvadersDebug } from './debug';

/**
 * Debug mode, to test the advanced rounds without playing well. Turn it on with
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

export const tuning = { debug } as const;
