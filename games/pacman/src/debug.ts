import { activeDebug, type DebugConfig } from '@arcade/debug';
import { tuning } from './tuning.config';

/** The debug options of Pac-Man (see the `debug` section of `tuning.config.ts`). */
export interface PacManDebug extends DebugConfig {
  /** The levels follow one another without the intermissions. */
  readonly skipIntermissions: boolean;
}

/** The normal game: level 1, every helper off. */
export const DEBUG_OFF: PacManDebug = {
  enabled: false,
  startLevel: 1,
  godMode: false,
  skipIntermissions: false,
};

/** The debug options in force: the ones of `tuning.config.ts` when debug is on, else `DEBUG_OFF`. */
export const debug: PacManDebug = activeDebug(tuning.debug, DEBUG_OFF);
