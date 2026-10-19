import { activeDebug, type DebugConfig } from '@arcade/debug';
import { tuning } from './tuning.config';

/** The debug options of Breakout (see the `debug` section of `tuning.config.ts`). */
export interface BreakoutDebug extends DebugConfig {
  /** The paddle spans the whole screen, as in the attract mode. */
  readonly fullPaddle: boolean;
  /** Paddle hits already counted at every serve: 4 and 12 are the speed-ups, 8 the flatter angle. */
  readonly startHits: number;
}

/** The normal game: first wall, every helper off. */
export const DEBUG_OFF: BreakoutDebug = {
  enabled: false,
  startLevel: 1,
  godMode: false,
  fullPaddle: false,
  startHits: 0,
};

/** The debug options in force: the ones of `tuning.config.ts` when debug is on, else `DEBUG_OFF`. */
export const debug: BreakoutDebug = activeDebug(tuning.debug, DEBUG_OFF);
