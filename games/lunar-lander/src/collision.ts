import type { View } from './lander';
import type { Orientation } from './module-view';
import { surfaceHeight } from './surface';
import { PROBES, type Point } from './surface-data';

/**
 * How far the module is from the surface [P DECODE, CNVRT, SCPDST]. In the close-up the program
 * probes four points of the large module, chosen for each orientation; in the whole view the
 * small module is a single point, its position. See docs/meccaniche-originali.md, section 5.
 *
 * The program measures the vertical distance under the two lower points and the horizontal
 * distance from the two upper ones to the next cliff, half of them on even frames and half on
 * odd ones. The remake measures every point every frame and calls it a collision when a point is
 * below the surface [N]: the result is the same at the speeds of the game.
 */

/** The probe points of the module, in world units, for its position and orientation. */
export interface Probes {
  readonly lowerLeft: Point;
  readonly lowerRight: Point;
  readonly upperLeft: Point;
  readonly upperRight: Point;
}

/** The probes at (`x`, `y`) with `orientation`: all at the position in the whole view. */
export const probesAt = (x: number, y: number, orientation: Orientation, view: View): Probes => {
  /** One probe point, from its table. */
  const probe = (table: readonly Point[]): Point => {
    if (view === 'major') return [x, y];
    const [dx, dy] = table[orientation] ?? [0, 0];
    return [x + dx, y + dy];
  };
  return {
    lowerLeft: probe(PROBES.lowerLeft),
    lowerRight: probe(PROBES.lowerRight),
    upperLeft: probe(PROBES.upperLeft),
    upperRight: probe(PROBES.upperRight),
  };
};

/** Height of a point above the surface under it: negative below. */
export const clearance = ([x, y]: Point): number => y - surfaceHeight(x);

/**
 * The altitude on the instruments: the smaller clearance of the two lower points [P SCPDST,
 * DISPLY], never below 0.
 */
export const altitudeOf = (probes: Probes): number =>
  Math.max(0, Math.min(clearance(probes.lowerLeft), clearance(probes.lowerRight)));

/** Whether a point of the module has gone into the surface: a crash [P DECODE: COLFLG 8F]. */
export const hitsSurface = (probes: Probes): boolean =>
  [probes.lowerLeft, probes.lowerRight, probes.upperLeft, probes.upperRight].some(
    (point) => clearance(point) < 0,
  );

/** Closer than this to the surface, both lower points count as touching it [P SCAPLND]. */
export const TOUCH_DISTANCE = 2;

/** Whether a point is on the surface or just above it, not inside. */
const touches = (point: Point): boolean => {
  const distance = clearance(point);
  return distance >= 0 && distance < TOUCH_DISTANCE;
};

/**
 * Whether both lower points touch the surface: the moment a landing is judged [P SCAPLND]. A
 * point already inside the surface does not count: that is a crash.
 */
export const isTouchingDown = (probes: Probes): boolean =>
  touches(probes.lowerLeft) && touches(probes.lowerRight);
