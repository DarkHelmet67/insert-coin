import { activeDebug, type DebugConfig } from '@arcade/debug';
import { tuning } from './tuning.config';

/** The debug options of Galaga (see the `debug` section of `tuning.config.ts`). */
export interface GalagaDebug extends DebugConfig {
  /** The tractor beam never catches the fighter. */
  readonly noCapture: boolean;
  /** Every new fighter arrives as a double fighter. */
  readonly startDual: boolean;
}

/** The normal game: stage 1, every helper off. */
export const DEBUG_OFF: GalagaDebug = {
  enabled: false,
  startLevel: 1,
  godMode: false,
  noCapture: false,
  startDual: false,
};

/** The debug options in force: the ones of `tuning.config.ts` when debug is on, else `DEBUG_OFF`. */
export const debug: GalagaDebug = activeDebug(tuning.debug, DEBUG_OFF);
