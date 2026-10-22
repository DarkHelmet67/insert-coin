import { isPixelOn, type Sprite } from '@arcade/render';
import type { FilledRect } from './recorder';

/** One lit pixel of the original screen, which a 3D renderer turns into a small cube. */
export interface Voxel {
  /** Column of the pixel, 0 at the left edge of the screen. */
  readonly x: number;
  /** Row of the pixel, 0 at the top edge of the screen. */
  readonly y: number;
  readonly color: string;
}

/** The pixels of one row of a rectangle. */
const rowVoxels = (left: number, y: number, width: number, color: string): Voxel[] =>
  Array.from({ length: width }, (_, column) => ({ x: left + column, y, color }));

/**
 * Splits one rectangle into its pixels, rounding the corners to whole pixels as drawing does.
 * Sprites are drawn one row at a time, so almost every rectangle is a single row: that case
 * skips the extra arrays, because this runs on thousands of rectangles every frame.
 */
const rectVoxels = ({ x, y, width, height, color }: FilledRect): readonly Voxel[] => {
  const left = Math.round(x);
  const top = Math.round(y);
  const columns = Math.round(width);
  const rows = Math.round(height);
  return rows === 1
    ? rowVoxels(left, top, columns, color)
    : Array.from({ length: rows }, (_, row) => rowVoxels(left, top + row, columns, color)).flat();
};

/**
 * Turns recorded rectangles into voxels, one per pixel.
 * Rectangles in `background` color are skipped: they are the cleared screen, not an object.
 * @param rects - what a drawing function drew, from `createDrawingRecorder`.
 * @param background - the color used to clear the screen.
 */
export const rectsToVoxels = (rects: readonly FilledRect[], background: string): readonly Voxel[] =>
  rects.filter((rect) => rect.color !== background).flatMap(rectVoxels);

/**
 * The voxels of `sprite` drawn with its top-left corner at (`x`, `y`), in `color`.
 * Useful to rebuild an object that has just disappeared, for example to blow it into pieces.
 */
export const spriteVoxels = (
  sprite: Sprite,
  x: number,
  y: number,
  color: string,
): readonly Voxel[] =>
  Array.from({ length: sprite.height }, (_, row) =>
    Array.from({ length: sprite.width }, (_, column) => column)
      .filter((column) => isPixelOn(sprite, column, row))
      .map((column) => ({ x: Math.round(x) + column, y: Math.round(y) + row, color })),
  ).flat();

/** Whether a voxel lies between rows `top` (included) and `bottom` (excluded). */
export const isBetweenRows = (voxel: Voxel, top: number, bottom: number): boolean =>
  voxel.y >= top && voxel.y < bottom;
