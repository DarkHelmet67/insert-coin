/*
 * The tractor beam is made of characters (`f_2222`, `d_23A1`): 10 rows of 6 cells under the
 * Boss, centered on the column the Boss aimed at. Its palette cycles every 4 frames.
 */
import type { DrawingContext } from '@arcade/render';
import { BEAM_ROWS, type Capture } from './capture-state';
import { drawArt } from './draw-art';
import { charColors } from './palette';
import { BEAM_TILES } from './rom/main-rom';
import { charArt } from './sprite-rom';
import { CELL } from './text';

/** Width of the beam in cells, and the screen row of its first row. */
const BEAM_WIDTH = 6;
const FIRST_ROW = 23;

/** One character of the beam. */
export interface BeamCell {
  readonly code: number;
  readonly column: number;
  readonly row: number;
}

/**
 * `c_238A`: the leftmost column of the beam. The program computes a character address from the
 * sprite x of the beam's center; the screen is rotated, so addresses run along the columns.
 */
export const beamColumn = (beamX: number): number => 29 - (((0x10 - beamX) & 0xff) >> 3);

/** The characters of the beam rows drawn so far. */
export const beamCells = (capture: Capture): readonly BeamCell[] =>
  Array.from({ length: BEAM_ROWS }, (_, row) => row).flatMap((row) =>
    capture.beamRows[row] === true
      ? Array.from({ length: BEAM_WIDTH }, (_, i) => ({
          code: BEAM_TILES[row * BEAM_WIDTH + i] ?? 0x24,
          column: beamColumn(capture.beamX) + i,
          row: FIRST_ROW + row,
        }))
      : [],
  );

/** The palette of the beam at `frame`: $18, $19, $1A in turn (`l_2246`). */
export const beamPalette = (frame: number): number => 0x17 + ((frame >> 2) & 3 || 1);

/** Draws the beam. */
export const drawBeam = (ctx: DrawingContext, capture: Capture, frame: number): void => {
  const colors = charColors(beamPalette(frame));
  beamCells(capture).forEach((cell) => {
    drawArt(ctx, charArt(cell.code), cell.column * CELL, cell.row * CELL, colors);
  });
};
