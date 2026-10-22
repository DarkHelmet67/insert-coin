import { degreesToRadians, type Vector3 } from './camera-rig';

/** How the playfield is turned, in radians, as `orientPlayfield` takes it. */
export interface Orientation {
  readonly tilt: number;
  readonly turn: number;
  readonly roll: number;
}

/** The sum of two vectors. */
const add = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });

/** `a` minus `b`. */
const subtract = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});

/** `v` stretched by `factor`. */
const scale = (v: Vector3, factor: number): Vector3 => ({
  x: v.x * factor,
  y: v.y * factor,
  z: v.z * factor,
});

/** The dot product: how far `a` goes along `b`, when `b` is one unit long. */
const dot = (a: Vector3, b: Vector3): number => a.x * b.x + a.y * b.y + a.z * b.z;

/** The cross product: a vector at right angles to both. */
const cross = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

/** `v` scaled to one unit of length. */
const normalize = (v: Vector3): Vector3 => scale(v, 1 / Math.hypot(v.x, v.y, v.z));

/** `p` turned by `angle` around the X axis. */
const rotateX = (p: Vector3, angle: number): Vector3 => ({
  x: p.x,
  y: p.y * Math.cos(angle) - p.z * Math.sin(angle),
  z: p.y * Math.sin(angle) + p.z * Math.cos(angle),
});

/** `p` turned by `angle` around the Y axis. */
const rotateY = (p: Vector3, angle: number): Vector3 => ({
  x: p.x * Math.cos(angle) + p.z * Math.sin(angle),
  y: p.y,
  z: -p.x * Math.sin(angle) + p.z * Math.cos(angle),
});

/** `p` turned by `angle` around the Z axis. */
const rotateZ = (p: Vector3, angle: number): Vector3 => ({
  x: p.x * Math.cos(angle) - p.y * Math.sin(angle),
  y: p.x * Math.sin(angle) + p.y * Math.cos(angle),
  z: p.z,
});

/**
 * Where a point of the playfield ends up once `orientPlayfield` has turned it. The order is
 * the Euler order 'XYZ' of the stage: around the playfield's own axes means, seen from the
 * world, the roll first, then the turn, then the tilt.
 * @param point - a point in the playfield's own coordinates.
 * @param orientation - the angles given to `orientPlayfield`.
 */
export const orientPoint = (point: Vector3, orientation: Orientation): Vector3 =>
  rotateX(rotateY(rotateZ(point, orientation.roll), orientation.turn), -orientation.tilt);

/**
 * How far from `target` a camera must stand, looking at it from `direction`, to see all
 * `points`. Each point closer to the camera than the target looks bigger, so the check is done
 * point by point: a point fits when its distance from the line of sight is at most the half
 * field of view times its depth. Solving for the camera distance gives one bound per point.
 * @param points - the points to keep in view, in world coordinates.
 * @param target - the point the camera looks at.
 * @param direction - from the target toward the camera, one unit long (not straight up).
 * @param verticalFov - vertical field of view of the camera, in degrees.
 * @param aspect - width divided by height of the picture.
 * @param margin - extra room around the points: 1.1 leaves 10% more.
 */
export const fitPointsDistance = (
  points: readonly Vector3[],
  target: Vector3,
  direction: Vector3,
  verticalFov: number,
  aspect: number,
  margin: number,
): number => {
  const tanUp = Math.tan(degreesToRadians(verticalFov) / 2) / margin;
  const tanSide = tanUp * aspect;
  // The same axes as a camera that looks at the target with the world's Y as "up".
  const right = normalize(cross({ x: 0, y: 1, z: 0 }, direction));
  const up = cross(direction, right);
  return points.reduce((distance, point) => {
    const offset = subtract(point, target);
    const nearer = dot(offset, direction);
    const forSide = nearer + Math.abs(dot(offset, right)) / tanSide;
    const forUp = nearer + Math.abs(dot(offset, up)) / tanUp;
    return Math.max(distance, forSide, forUp);
  }, 0);
};

/**
 * The camera position `distance` away from `target` along `direction`.
 * @param target - the point the camera looks at.
 * @param direction - from the target toward the camera, one unit long.
 * @param distance - how far from the target.
 */
export const standBack = (target: Vector3, direction: Vector3, distance: number): Vector3 =>
  add(target, scale(direction, distance));
