import { activeDebug, type DebugConfig } from '@arcade/debug';
import { tuning } from './tuning.config';

/** The debug options of Lunar Lander (see the `debug` section of `tuning.config.ts`). */
export interface LunarLanderDebug extends DebugConfig {
  /** The engine and the rotation burn no fuel. */
  readonly infiniteFuel: boolean;
}

/** The normal game: TRAINING first, every helper off. */
export const DEBUG_OFF: LunarLanderDebug = {
  enabled: false,
  startLevel: 1,
  godMode: false,
  infiniteFuel: false,
};

/** The debug options in force: the ones of `tuning.config.ts` when debug is on, else `DEBUG_OFF`. */
export const debug: LunarLanderDebug = activeDebug(tuning.debug, DEBUG_OFF);
