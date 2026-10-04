import { landerOrientation, type Lander } from './lander';
import { UPRIGHT, type Orientation } from './module-view';
import { rotationAt } from './rotation';
import { ABORT_THRUST, type ThrustLevel } from './thrust';
import { withSignOf } from './velocity';

/**
 * The ABORT button [P PLYCHK, ABORT]: the module turns upright by itself, the sideways speed
 * drains away and the engine fires at a power the lever cannot reach, until the module climbs
 * fast enough. See docs/meccaniche-originali.md, section 7.
 */

/** Frames of full power an abort can last [P ABTCNT]. */
export const ABORT_FRAMES = 100;
/** Below this count the abort ends as soon as the climb is fast enough [P ABTMIN]. */
export const ABORT_MIN = 60;
/** The climbing speed that ends the abort [P ABORT: VELY+1 >= 10]. */
export const ABORT_CLIMB = 0x1000;

/** An abort in progress: frames of full power left, 0 when none. */
export type AbortCount = number;

/** One step toward upright, the shorter way round [P ABORT 10$]. */
export const towardUpright = (orientation: Orientation): Orientation => {
  if (orientation === UPRIGHT) return orientation;
  return orientation > UPRIGHT && orientation < 25 ? orientation - 1 : (orientation + 1) & 0x1f;
};

/** The sideways speed loses 256 a frame [P ABORT 20$: VELX+1 - 1]. */
const drain = (speed: number): number =>
  withSignOf(speed, Math.abs(speed) < 0x100 ? 0 : Math.abs(speed) - 0x100);

/** What the abort does in one frame. */
export interface AbortFrame {
  readonly lander: Lander;
  readonly count: AbortCount;
  /** Thrust for the next frame: ABORT's power once upright, otherwise unchanged. */
  readonly thrust: ThrustLevel;
}

/**
 * One frame of abort, after the module has moved [P ABORT]. On odd frames the module turns one
 * step toward upright, which also stops a COMMAND spin. Once upright the engine fires at full
 * power for up to 100 frames; after 40 of them it stops as soon as the module climbs at 0x1000.
 */
export const abortFrame = (
  lander: Lander,
  count: AbortCount,
  thrust: ThrustLevel,
  frame: number,
): AbortFrame => {
  if (count === 0) return { lander, count, thrust };
  const orientation =
    frame % 2 === 1 ? towardUpright(landerOrientation(lander)) : landerOrientation(lander);
  const turned: Lander = {
    ...lander,
    rotation: orientation === landerOrientation(lander) ? lander.rotation : rotationAt(orientation),
    vx: drain(lander.vx),
  };
  if (orientation !== UPRIGHT) return { lander: turned, count, thrust };
  if (count < ABORT_MIN && turned.vy >= ABORT_CLIMB) return { lander: turned, count: 0, thrust };
  return { lander: turned, count: count - 1, thrust: ABORT_THRUST };
};
