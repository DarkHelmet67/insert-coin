import { DIRECTION_STEPS } from './rom/main-rom';

/**
 * A point in the program's own coordinates: two bytes, `x` in the high byte and `y` in the low
 * one. On screen x grows to the left and y downwards; positions are in pixels, tiles in cells
 * (see `tileOf`). Bytes wrap around at 256, which is how the tunnels connect the two sides.
 */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** The four directions, numbered as in the program. */
export const DIRECTION = { right: 0, down: 1, left: 2, up: 3 } as const;

/** One of the four directions. */
export type Direction = (typeof DIRECTION)[keyof typeof DIRECTION];

/** A byte of the Z80: values wrap around at 256. */
export const toByte = (value: number): number => value & 0xff;

/** The sum of two points, byte by byte. */
export const addPoints = (a: Point, b: Point): Point => ({
  x: toByte(a.x + b.x),
  y: toByte(a.y + b.y),
});

/** The one-pixel (or one-tile) step of a direction, from the table at $32FF (y, x per direction). */
export const directionStep = (direction: Direction): Point => ({
  y: DIRECTION_STEPS[direction * 2] ?? 0,
  x: DIRECTION_STEPS[direction * 2 + 1] ?? 0,
});

/** The direction facing the other way. */
export const oppositeDirection = (direction: Direction): Direction => (direction ^ 2) as Direction;

/** Whether a direction moves along y (down, up) rather than x. */
export const isVertical = (direction: Direction): boolean => (direction & 1) === 1;

/** The tile holding a pixel position (routine $2018). */
export const tileOf = (position: Point): Point => ({
  x: (position.x >> 3) + 0x1e,
  y: (position.y >> 3) + 0x20,
});

/**
 * The video address of a tile (routine $202D): playfield tiles x $20-$3B and y $20-$3F. Out of
 * that range, in the tunnels, the program never reads the address; here it stays in video RAM.
 */
export const tileAddress = (tile: Point): number =>
  (0x40 + toByte(tile.x - 0x20) * 0x20 + toByte(tile.y - 0x20)) & 0x3ff;

/** Whether a coordinate is at the middle of its tile, where actors can turn. */
export const isCentered = (coordinate: number): boolean => (coordinate & 7) === 4;

/** Whether a tile is in one of the two tunnels: the outermost column on each side, or beyond it ($1852). */
export const isTunnelTile = (tile: Point): boolean => tile.x < 0x21 || tile.x >= 0x3b;

/** The same points: positions are compared byte by byte. */
export const samePoint = (a: Point, b: Point): boolean => a.x === b.x && a.y === b.y;
