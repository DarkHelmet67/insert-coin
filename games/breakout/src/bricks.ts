import type { Rect } from '@arcade/collision';
import {
  BRICK_COLUMNS,
  BRICK_HEIGHT,
  BRICK_PITCH,
  BRICK_ROWS,
  BRICK_WIDTH,
  BRICKS_TOP,
} from './playfield';
import { tuning } from './tuning.config';

/**
 * The wall of bricks: one flag per brick, row by row from the top (row 0) to the bottom
 * (row 7). The original kept exactly this in a 256x1 RAM chip, one bit per brick.
 */
export type Wall = readonly boolean[];

/** A brick position: row 0 is the top (red) row, column 0 is on the left. */
export interface BrickPosition {
  readonly row: number;
  readonly column: number;
}

/** A complete wall: 8 rows of 14 bricks. */
export const fullWall = (): Wall => Array.from({ length: BRICK_ROWS * BRICK_COLUMNS }, () => true);

/** Index of a brick in the wall array. */
const indexOf = ({ row, column }: BrickPosition): number => row * BRICK_COLUMNS + column;

/** Whether the brick at `position` is still standing. */
export const hasBrick = (wall: Wall, position: BrickPosition): boolean =>
  wall[indexOf(position)] ?? false;

/** Returns the wall without the brick at `position`. */
export const removeBrick = (wall: Wall, position: BrickPosition): Wall =>
  wall.map((standing, index) => standing && index !== indexOf(position));

/** Every position of the wall, row by row. */
export const brickPositions = (): readonly BrickPosition[] =>
  Array.from({ length: BRICK_ROWS * BRICK_COLUMNS }, (_, index) => ({
    row: Math.floor(index / BRICK_COLUMNS),
    column: index % BRICK_COLUMNS,
  }));

/** Where the brick at `position` sits: the ball bounces on this rectangle. */
export const brickRect = ({ row, column }: BrickPosition): Rect => ({
  x: column * BRICK_PITCH,
  y: BRICKS_TOP + row * BRICK_HEIGHT,
  width: BRICK_WIDTH,
  height: BRICK_HEIGHT,
});

/** The visible part of a brick: its rectangle minus the thin gap below each row. */
export const brickShape = (position: BrickPosition): Rect => {
  const rect = brickRect(position);
  return { ...rect, height: rect.height - tuning.brickRowGap };
};

/** Points for each pair of rows from the top: red 7, orange 5, green 3, yellow 1. */
const ROW_PAIR_POINTS: readonly number[] = [7, 5, 3, 1];

/** Points scored by breaking a brick in `row`. */
export const brickPoints = (row: number): number => ROW_PAIR_POINTS[Math.floor(row / 2)] ?? 0;
