import type { View } from './lander';
import { wrapX, type SurfaceProjection } from './surface';

/**
 * What the screen shows and when it changes [P SCAPCHG, SCAPMJR, SCRLUP]. See
 * docs/meccaniche-originali.md, section 2.
 *
 * The program moves the module on the screen and scrolls the surface only when the module nears
 * an edge. The remake keeps the module in the world and moves a camera with the same rules: the
 * module is free between x = 128 and x = 896, beyond those the camera follows it [N: the program
 * lets it overshoot by one frame].
 */

/** The camera. */
export interface Camera {
  readonly view: View;
  /** World x shown at the left edge of the screen, 0 to 4095. */
  readonly x: number;
  /**
   * Vertical scroll. Whole-surface view: how far the sky has scrolled up, in screen units
   * (0 to 512). Close-up: the world y shown at the bottom of the screen.
   */
  readonly scroll: number;
}

/** The screen limits of the module [P XMIN, XMAX, YMJMAX, YMIMIN, YMIMAX]. */
export const LIMITS = {
  left: 128,
  right: 896,
  majorTop: 660,
  minorBottom: 256,
  minorTop: 660,
} as const;

/** Sky scroll that sends the module off into space [P SCAPMJR 27$]. */
export const FLY_OFF_SCROLL = 512;
/** Below this altitude (world units, 96 x 4) the close-up starts [P YMJMIN]. */
export const CLOSE_UP_ALTITUDE = 96 * 4;
/** Above this altitude the close-up stops scrolling up and goes back to the whole view [P YMISCR]. */
export const WIDE_VIEW_ALTITUDE = 520;
/** Where the module appears when the close-up starts [P MINSTX, MINSTY]. */
export const CLOSE_UP_START = { x: 512, y: 632 } as const;
/** Where the module appears when the whole view comes back [P RMJRX]. */
export const WIDE_VIEW_X = 512;
/** Screen y of world y = 0 in the whole view, sky not scrolled [P TRANS, LUNMJ0]. */
export const MAJOR_BOTTOM = 8;

/** World units per screen unit. */
export const zoomOf = (view: View): number => (view === 'major' ? 4 : 1);

/** The camera at the start of a mission: whole view, nothing scrolled. */
export const startingCamera: Camera = { view: 'major', x: 0, scroll: 0 };

/** Where world point (`x`, `y`) lands on the screen. */
export const toScreen = (camera: Camera, x: number, y: number): { x: number; y: number } => {
  const zoom = zoomOf(camera.view);
  const bottom = camera.view === 'major' ? MAJOR_BOTTOM - camera.scroll : -camera.scroll / zoom;
  return { x: wrapX(x - camera.x) / zoom, y: y / zoom + bottom };
};

/** How the surface is drawn with this camera. */
export const projection = (camera: Camera): SurfaceProjection => {
  const origin = toScreen(camera, 0, 0);
  return { zoom: zoomOf(camera.view), left: origin.x, bottom: origin.y };
};

/** What the module does to the camera this frame. */
export interface CameraInput {
  /** The module's position in world units. */
  readonly x: number;
  readonly y: number;
  /** Its speeds: only the signs matter. */
  readonly vx: number;
  readonly vy: number;
  /** Its height above the surface, in world units. */
  readonly altitude: number;
}

/** The camera after the frame, and whether the module flew off into space. */
export interface CameraFrame {
  readonly camera: Camera;
  readonly flewOff: boolean;
}

/** The camera follows the module sideways when it passes x = 128 or 896 going that way. */
const followSideways = (camera: Camera, input: CameraInput): Camera => {
  const zoom = zoomOf(camera.view);
  const screenX = toScreen(camera, input.x, input.y).x;
  if (input.vx > 0 && screenX > LIMITS.right) {
    return { ...camera, x: wrapX(camera.x + (screenX - LIMITS.right) * zoom) };
  }
  if (input.vx < 0 && screenX < LIMITS.left) {
    return { ...camera, x: wrapX(camera.x - (LIMITS.left - screenX) * zoom) };
  }
  return camera;
};

/** The close-up, with the module at (512, 632) [P SCAPMJR 40$]. */
export const closeUpOn = (x: number, y: number): Camera => ({
  view: 'minor',
  x: wrapX(x - CLOSE_UP_START.x),
  scroll: y - CLOSE_UP_START.y,
});

/** The whole view, with the module at x = 512 and the sky not scrolled [P SCRLUP]. */
export const wideViewOn = (x: number): Camera => ({
  view: 'major',
  x: wrapX(x - WIDE_VIEW_X * zoomOf('major')),
  scroll: 0,
});

/**
 * Whole view [P SCAPMJR]: going up past y = 660 scrolls the sky, 512 units of it and the module
 * is lost; coming down scrolls it back first; below 384 units of altitude the close-up starts.
 */
const followWide = (camera: Camera, input: CameraInput): CameraFrame => {
  const screenY = toScreen(camera, input.x, input.y).y;
  if (input.vy >= 0 && screenY > LIMITS.majorTop) {
    const scroll = camera.scroll + screenY - LIMITS.majorTop;
    return { camera: { ...camera, scroll }, flewOff: scroll >= FLY_OFF_SCROLL };
  }
  if (input.vy < 0 && camera.scroll > 0) {
    const down = Math.max(0, LIMITS.majorTop - screenY);
    return { camera: { ...camera, scroll: Math.max(0, camera.scroll - down) }, flewOff: false };
  }
  if (input.altitude < CLOSE_UP_ALTITUDE) {
    return { camera: closeUpOn(input.x, input.y), flewOff: false };
  }
  return { camera, flewOff: false };
};

/**
 * Close-up [P SCAPCHG 40$]: the camera follows the module down below y = 256 and up above
 * y = 660, but going up with more than 520 units of altitude it goes back to the whole view.
 */
const followCloseUp = (camera: Camera, input: CameraInput): Camera => {
  const screenY = toScreen(camera, input.x, input.y).y;
  if (input.vy < 0 && screenY < LIMITS.minorBottom) {
    return { ...camera, scroll: camera.scroll - (LIMITS.minorBottom - screenY) };
  }
  if (input.vy >= 0 && screenY > LIMITS.minorTop) {
    return input.altitude < WIDE_VIEW_ALTITUDE
      ? { ...camera, scroll: camera.scroll + screenY - LIMITS.minorTop }
      : wideViewOn(input.x);
  }
  return camera;
};

/** The camera after the module has moved [P SCAPCHG]. */
export const followLander = (camera: Camera, input: CameraInput): CameraFrame => {
  const sideways = followSideways(camera, input);
  return sideways.view === 'major'
    ? followWide(sideways, input)
    : { camera: followCloseUp(sideways, input), flewOff: false };
};
