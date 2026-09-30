/**
 * Positions of the moving objects, in the units of the 6502 program [P $6FC7]: 8 position units
 * make one unit of the vector screen, so the playfield is 8192 × 6144 and moves can be finer
 * than the beam. Everything wraps around the edges, except the saucer (later).
 */

/** Playfield size in position units: 1024 × 768 screen units, 8 position units each. */
export const FIELD_WIDTH = 8192;
export const FIELD_HEIGHT = 6144;

/** A point of the playfield, in position units: x to the right, y upwards. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Brings a coordinate back inside 0..size - 1: out on one side, in on the other [P $6FD8]. */
export const wrap = (value: number, size: number): number => ((value % size) + size) % size;

/** Moves a point by (dx, dy) and wraps it around the edges of the playfield. */
export const movePoint = (point: Point, dx: number, dy: number): Point => ({
  x: wrap(point.x + dx, FIELD_WIDTH),
  y: wrap(point.y + dy, FIELD_HEIGHT),
});

/**
 * Where a point appears on the vector screen [P $72FE]: x / 8, and y / 8 + 128 because the
 * visible screen starts at y = 128. The program drops the remainder, so objects move on the
 * whole units of the screen.
 */
export const toScreen = (point: Point): Point => ({
  x: point.x >> 3,
  y: (point.y >> 3) + 128,
});
