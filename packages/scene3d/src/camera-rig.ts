import { clamp } from '@arcade/math';

/** A point or a direction in the 3D world. */
export interface Vector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Converts degrees, the unit of the tuning files, into radians, the unit of the math. */
export const degreesToRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * Maps `value` from the range [`inMin`, `inMax`] to [`outMin`, `outMax`], clamped at the ends.
 * For example the cannon's position on the screen becomes the camera's angle.
 */
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number => {
  const t = inMax === inMin ? 0 : clamp((value - inMin) / (inMax - inMin), 0, 1);
  return outMin + (outMax - outMin) * t;
};

/**
 * Moves `current` toward `target`, covering a share of the gap that depends on the time elapsed:
 * exponential smoothing. The result is the same at 30, 60 or 144 frames per second, which a
 * fixed "move 10% per frame" would not be.
 * @param current - the value now.
 * @param target - the value to reach.
 * @param rate - how fast the gap closes, per second: after `1 / rate` seconds about 63% of it is gone.
 * @param dt - seconds since the last call.
 */
export const smoothTowards = (current: number, target: number, rate: number, dt: number): number =>
  current + (target - current) * (1 - Math.exp(-rate * dt));

/**
 * Where a camera stands when it orbits around the origin, looking at it.
 * @param yaw - turn around the vertical axis, in radians: positive moves the camera to the right.
 * @param pitch - height angle, in radians: positive lifts the camera above the origin.
 * @param distance - distance from the origin.
 */
export const orbitPosition = (yaw: number, pitch: number, distance: number): Vector3 => ({
  x: distance * Math.sin(yaw) * Math.cos(pitch),
  y: distance * Math.sin(pitch),
  z: distance * Math.cos(yaw) * Math.cos(pitch),
});

/**
 * The distance at which a perspective camera sees a whole `width` × `height` rectangle,
 * whatever the shape of the window.
 * @param width - width of the rectangle.
 * @param height - height of the rectangle.
 * @param verticalFov - vertical field of view of the camera, in degrees.
 * @param aspect - width divided by height of the picture.
 * @param margin - extra room around the rectangle: 1.1 leaves 10% more.
 */
export const fitDistance = (
  width: number,
  height: number,
  verticalFov: number,
  aspect: number,
  margin: number,
): number => {
  const halfTan = Math.tan(degreesToRadians(verticalFov) / 2);
  const forHeight = height / 2 / halfTan;
  const forWidth = width / 2 / (halfTan * aspect);
  return Math.max(forHeight, forWidth) * margin;
};
