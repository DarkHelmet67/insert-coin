import type { Point } from './position';

/**
 * How the small saucer aims at the ship [P $6C65-$6CC2], with the 8-bit arithmetic of the
 * program: a rough direction from a table of 16 angles, then a random error that shrinks when
 * the player gets good.
 */

/** A number as the 6502 reads a byte with a sign: 0-127 positive, 128-255 negative. */
export const toSigned8 = (value: number): number => ((value & 0xff) ^ 0x80) - 0x80;

/**
 * The angles of the first eighth of a turn [P $772F], for a slope of 0/16, 1/16 ... 15/16:
 * 32 is 45 degrees.
 */
export const ARCTAN_TABLE: readonly number[] = [
  0x00, 0x02, 0x05, 0x07, 0x0a, 0x0c, 0x0f, 0x11, 0x13, 0x15, 0x17, 0x19, 0x1a, 0x1c, 0x1d, 0x1f,
];

/** The table angle for `small / large`, with `small < large`: the slope in sixteenths [P $776C]. */
const tableAngle = (small: number, large: number): number =>
  ARCTAN_TABLE[Math.floor((16 * small) / large)] ?? 0;

/**
 * The direction (0-255, 0 = right, 64 = up) of the vector (x, y) [P $76F0]. The program works
 * out the first quarter and mirrors it for the other three; equal x and y (even both 0) give
 * exactly 45 degrees.
 */
export const arctan = (x: number, y: number): number => {
  if (y < 0) return -arctan(x, -y) & 0xff;
  if (x < 0) return (0x80 - arctan(-x, y)) & 0xff;
  if (x === y) return 0x20;
  return y < x ? tableAngle(y, x) : 0x40 - tableAngle(x, y);
};

/**
 * One axis of the aim [P $6C6D]: the distance to the ship in blocks of 64 position units,
 * minus half the saucer's own speed, kept in one signed byte like in the program.
 */
export const aimAxis = (target: number, from: number, speed: number): number =>
  toSigned8(((target - from) >> 6) - (speed >> 1));

/** The direction from the saucer to the ship, before the random error. */
export const aimDirection = (
  saucer: { readonly position: Point; readonly vx: number; readonly vy: number },
  ship: Point,
): number =>
  arctan(
    aimAxis(ship.x, saucer.position.x, saucer.vx),
    aimAxis(ship.y, saucer.position.y, saucer.vy),
  );

/** Score from which the small saucer aims better [P $6CB3]. */
export const SHARP_AIM_SCORE = 35000;

/**
 * The random error added to the aim [P $6CAC-$6CC2, tables $6CCF and $6CD1]: -16 to +15 units
 * of direction (about ±22 degrees), and -8 to +7, plus one, from 35,000 points (about ±11).
 */
export const aimError = (value: number, score: number): number => {
  const sharp = score >= SHARP_AIM_SCORE;
  const masked = value & (sharp ? 0x87 : 0x8f);
  const extended = masked & 0x80 ? masked | (sharp ? 0x78 : 0x70) : masked;
  return toSigned8(extended) + (sharp ? 1 : 0);
};

/** The direction of a small saucer's shot: the aim plus its error. */
export const smallSaucerShot = (
  saucer: { readonly position: Point; readonly vx: number; readonly vy: number },
  ship: Point,
  value: number,
  score: number,
): number => (aimDirection(saucer, ship) + aimError(value, score)) & 0xff;
