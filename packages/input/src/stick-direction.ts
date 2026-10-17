import type { KeyCode } from './key-state';

/**
 * Which directions a joystick reports: `left-right` for games that only move sideways
 * (Space Invaders, Galaga, the rotation of Asteroids and Lunar Lander), `four-way` for a maze
 * game like Pac-Man, whose cabinet stick has a gate that lets it move along one axis at a time.
 */
export type StickDirections = 'left-right' | 'four-way';

/** A point on the screen, in CSS pixels. */
export interface StickPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * Where the knob is, relative to the centre of the base: from -1 to 1 on each axis, never
 * outside the unit circle. `y` grows downwards, like on the screen.
 */
export interface StickOffset {
  readonly x: number;
  readonly y: number;
}

/** The knob at rest, in the middle of the base. */
export const centered: StickOffset = { x: 0, y: 0 };

/**
 * The knob position for a finger at `finger`, on a base centred at `center` with the given
 * `radius`. A finger farther than the radius pulls the knob to the edge, in its direction:
 * this is what lets the thumb drift off the base without losing the stick.
 */
export const stickOffset = (
  finger: StickPoint,
  center: StickPoint,
  radius: number,
): StickOffset => {
  if (radius <= 0) return centered;
  const x = (finger.x - center.x) / radius;
  const y = (finger.y - center.y) / radius;
  const length = Math.hypot(x, y);
  return length > 1 ? { x: x / length, y: y / length } : { x, y };
};

/** Keys for a stick that only moves sideways: the vertical part of the push is ignored. */
const leftRightKeys = ({ x }: StickOffset, deadZone: number): readonly KeyCode[] => {
  if (x < -deadZone) return ['ArrowLeft'];
  if (x > deadZone) return ['ArrowRight'];
  return [];
};

/**
 * Keys for a 4-way stick: only the stronger axis counts, so a diagonal push never holds two
 * arrows at once (on the real cabinet the gate around the stick makes diagonals impossible).
 * On an exact diagonal the horizontal direction wins.
 */
const fourWayKeys = ({ x, y }: StickOffset, deadZone: number): readonly KeyCode[] => {
  if (Math.hypot(x, y) <= deadZone) return [];
  if (Math.abs(x) >= Math.abs(y)) return [x < 0 ? 'ArrowLeft' : 'ArrowRight'];
  return [y < 0 ? 'ArrowUp' : 'ArrowDown'];
};

/**
 * The arrow keys held by a stick at `offset`. Inside the dead zone (a fraction of the radius,
 * from 0 to 1) no key is held, so a thumb resting on the knob does not move the player.
 */
export const stickKeys = (
  offset: StickOffset,
  directions: StickDirections,
  deadZone: number,
): ReadonlySet<KeyCode> =>
  new Set(
    directions === 'four-way' ? fourWayKeys(offset, deadZone) : leftRightKeys(offset, deadZone),
  );

/** The knob as it is drawn: a sideways stick does not move up and down. */
export const shownOffset = (offset: StickOffset, directions: StickDirections): StickOffset =>
  directions === 'four-way' ? offset : { x: offset.x, y: 0 };
