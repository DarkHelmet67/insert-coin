import { TILE } from './maze';
import { POINTS } from './score';

/** What Pac-Man found on his tile ($19D2-$1A18). */
export interface Meal {
  /** The tile eaten: a dot or an energizer. */
  readonly tile: number;
  /** The entry of the points table. */
  readonly points: number;
  /** Updates Pac-Man stands still while swallowing: 1 frame for a dot, 3 for an energizer. */
  readonly pause: number;
}

/**
 * The meal on a tile, if any. The program keeps Pac-Man still with a counter that skips the
 * updates until it wraps from 0 to $FF: set to 1 it skips 2 updates, set to 6 it skips 7, and
 * Pac-Man moves at most once per update, twice per frame.
 */
export const mealOn = (tile: number): Meal | undefined => {
  if (tile === TILE.dot) return { tile, points: POINTS.dot, pause: 1 };
  if (tile === TILE.energizer) return { tile, points: POINTS.energizer, pause: 6 };
  return undefined;
};
