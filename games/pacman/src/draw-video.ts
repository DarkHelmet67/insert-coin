import type { DrawingContext } from '@arcade/render';
import { drawArt } from '@arcade/tiles';
import { paletteColors } from './palette';
import { charArt } from './tile-art';
import { cellAddress, COLUMNS, ROWS, type Video } from './video';

/** Side of a cell in pixels. */
export const CELL = 8;

/** Whether the cell at `address` looks different in the two videos. */
const cellChanged = (previous: Video, video: Video, address: number): boolean =>
  previous.tiles[address] !== video.tiles[address] ||
  previous.colors[address] !== video.colors[address];

/** Draws one cell over a black square, as the hardware shows it. */
const drawCell = (ctx: DrawingContext, video: Video, column: number, row: number): void => {
  const address = cellAddress(column, row);
  ctx.fillStyle = '#000';
  ctx.fillRect(column * CELL, row * CELL, CELL, CELL);
  drawArt(
    ctx,
    charArt(video.tiles[address] ?? 0),
    column * CELL,
    row * CELL,
    paletteColors((video.colors[address] ?? 0) & 0x1f),
  );
};

/**
 * Draws the tiles of `video`. With the `previous` video already on the canvas it redraws only
 * the cells that changed: from one frame to the next that is a dot or a digit of the score, so
 * the 1008 cells of the screen are drawn just once.
 */
export const drawVideo = (ctx: DrawingContext, video: Video, previous?: Video): void => {
  Array.from({ length: ROWS }, (_, row) => row).forEach((row) => {
    Array.from({ length: COLUMNS }, (_, column) => column).forEach((column) => {
      if (previous === undefined || cellChanged(previous, video, cellAddress(column, row))) {
        drawCell(ctx, video, column, row);
      }
    });
  });
};
