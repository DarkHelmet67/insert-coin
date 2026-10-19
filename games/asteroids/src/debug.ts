import { activeDebug, type DebugConfig } from '@arcade/debug';
import { tuning } from './tuning.config';

/** The debug options of Asteroids (see the `debug` section of `tuning.config.ts`). */
export interface AsteroidsDebug extends DebugConfig {
  /** A hyperspace jump never destroys the ship. */
  readonly safeHyperspace: boolean;
}

/** The normal game: first wave, every helper off. */
export const DEBUG_OFF: AsteroidsDebug = {
  enabled: false,
  startLevel: 1,
  godMode: false,
  safeHyperspace: false,
};

/** The debug options in force: the ones of `tuning.config.ts` when debug is on, else `DEBUG_OFF`. */
export const debug: AsteroidsDebug = activeDebug(tuning.debug, DEBUG_OFF);
