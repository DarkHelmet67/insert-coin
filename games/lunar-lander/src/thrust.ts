import type { Orientation } from './module-view';
import type { MissionRules } from './missions';

/**
 * The engine: from the thrust lever to the push on the module [P THRLVL, FRCMLT, ACCEL].
 * See docs/meccaniche-originali.md, section 3.
 */

/** Thrust levels of the lever: 0 to 15, plus 16 used only by ABORT [P THRLVL, ABORT]. */
export type ThrustLevel = number;

/** The level ABORT forces, the strongest push the engine has [P ABORT]. */
export const ABORT_THRUST: ThrustLevel = 16;

/** The lever is a potentiometer read as a number from 0 to 255 [P LUNINT POTIN]. */
export const LEVER_MAX = 255;

/**
 * Acceleration for each thrust level [P TRSTAB]: not a straight line, the first notches give
 * little, the last ones a lot. 0xFF is ABORT.
 */
export const THRUST_TABLE: readonly number[] = [
  0x00, 0x02, 0x05, 0x08, 0x0b, 0x0d, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x16, 0x18, 0x1a, 0x1c,
  0xff,
];

/**
 * The thrust level of the lever [P THRLVL]. The lowest quarter of its travel is "off", the top
 * eighth is "full" (15), in between the level is the fraction of the travel times 16. So the
 * levels jump from 0 straight to 4, and from 13 straight to 15: a cabinet detail the remake keeps.
 */
export const leverThrust = (lever: number, range: number = LEVER_MAX): ThrustLevel => {
  if (lever <= range >> 2) return 0;
  if (range - lever < range >> 3) return 15;
  return Math.floor((lever * 256) / range) >> 4;
};

/**
 * "Sines" of the 9 orientations of a quarter turn [P SINES]. The comments of the program call them
 * 0.0, 0.196, 0.371, 0.6, 0.707, 0.8, 0.928, 0.98, 1.0: not the sines of 11.25-degree steps, but
 * the values the game was tuned with.
 */
export const SINES: readonly number[] = [0, 0x32, 0x5f, 0x9a, 0xb5, 0xcd, 0xee, 0xfb, 0xff];

/** The fractional multiply of the program: `a x b / 256`, rounded down [P MULTPA]. */
export const multiplyFraction = (a: number, b: number): number => (a * b) >> 8;

/** A push along the two axes, in speed units per frame. */
export interface Push {
  readonly x: number;
  readonly y: number;
}

/**
 * Signs of the push in each quarter of the turn [P SIGNS]: orientations 0-7 push right and up,
 * 8-15 left and up, 16-23 left and down, 24-31 right and down.
 */
const QUADRANT_SIGNS: readonly Push[] = [
  { x: 1, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: -1 },
  { x: 1, y: -1 },
];

/**
 * Index in {@link SINES} of the vertical part of the push [P FRCMLT]: 0 when the engine points
 * sideways, 8 when it points down or up. The horizontal part uses `8 - index`.
 */
export const verticalSineIndex = (orientation: Orientation): number => {
  const inHalf = orientation & 0x0f;
  return inHalf < 9 ? inHalf : 16 - inHalf;
};

/**
 * The push of the engine on the module this frame [P FRCMLT, ACCEL]: the acceleration of the
 * thrust level split along the axes with {@link SINES}. PRIME adds half of it again.
 */
export const enginePush = (
  orientation: Orientation,
  thrust: ThrustLevel,
  rules: MissionRules,
): Push => {
  const power = THRUST_TABLE[thrust] ?? 0;
  const vertical = verticalSineIndex(orientation);
  const signs = QUADRANT_SIGNS[orientation >> 3] ?? { x: 1, y: 1 };
  /** One axis, with the extra power of PRIME. */
  const axis = (sine: number): number => {
    const push = multiplyFraction(SINES[sine] ?? 0, power);
    return rules.strongEngine ? push + (push >> 1) : push;
  };
  /** A magnitude with the sign of its quadrant, without producing -0. */
  const signed = (sign: number, magnitude: number): number =>
    magnitude === 0 ? 0 : sign * magnitude;
  return { x: signed(signs.x, axis(8 - vertical)), y: signed(signs.y, axis(vertical)) };
};
