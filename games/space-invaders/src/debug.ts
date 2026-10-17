import { activeDebug, type DebugConfig } from '@arcade/debug';
import { tuning } from './tuning.config';

/** The debug options of Space Invaders (see the `debug` section of `tuning.config.ts`). */
export interface SpaceInvadersDebug extends DebugConfig {
  /** Shots, bombs and invaders leave the shields intact. */
  readonly noShieldDamage: boolean;
}

/** The normal game: first round, every helper off. */
export const DEBUG_OFF: SpaceInvadersDebug = {
  enabled: false,
  startLevel: 1,
  godMode: false,
  noShieldDamage: false,
};

/** The debug options in force: the ones of `tuning.config.ts` when debug is on, else `DEBUG_OFF`. */
export const debug: SpaceInvadersDebug = activeDebug(tuning.debug, DEBUG_OFF);
