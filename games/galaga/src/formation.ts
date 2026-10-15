import { BREATHING_BITMAPS } from './rom/main-rom';

/*
 * The formation grid: 10 columns and 6 rows (`db_fmtn_hpos_orig`). Each column and each row has
 * an origin and an offset that the sway and the "breathing" of the formation change; the
 * sprites of the resting aliens follow the sum.
 */

/** Columns are cells 0-9 (x), rows cells 10-15 (y). */
export const COLUMNS = 10;
export const ROWS = 6;

/**
 * Origin of each cell, as the program stores it: column x in pixels, row height in the flight
 * coordinates of the second processor (units of 2 pixels, growing upwards).
 */
export const CELL_ORIGINS = [
  0x31, 0x41, 0x51, 0x61, 0x71, 0x81, 0x91, 0xa1, 0xb1, 0xc1, 0x92, 0x8a, 0x82, 0x7c, 0x76, 0x70,
] as const;

/** The grid as it is at one moment. */
export interface Formation {
  /** Offset of each cell from its origin (`ds_hpos_loc_offs`), a byte. */
  readonly offsets: readonly number[];
  /** Sprite coordinate of each cell (`ds_hpos_spcoords`): x of columns, 9-bit y of rows. */
  readonly spriteCoords: readonly number[];
  /**
   * `ds_9200_glbls[$0F]`: while swaying, 0 moving right and 1 moving left; while breathing, a
   * counter that goes up from 0 to $1F (opening) and down from $A0 to $81 (closing).
   */
  readonly direction: number;
  /** The working copy of the breathing bitmap (`ds10_9920`): which cells move this time. */
  readonly bitmap: readonly number[];
}

/** Sprite y of a row origin: the "$0160 - 2n" of `c_12C3`. */
const rowSpriteY = (origin: number): number => ((~(origin + 0x4f) & 0xff) << 1) & 0x1ff;

/** `c_12C3`: the grid at its origin, as each stage starts. */
export const initialFormation = (): Formation => ({
  offsets: CELL_ORIGINS.map(() => 0),
  spriteCoords: CELL_ORIGINS.map((origin, cell) => (cell < COLUMNS ? origin : rowSpriteY(origin))),
  direction: 0,
  bitmap: CELL_ORIGINS.map(() => 0),
});

/** Origin of a cell (`ds_hpos_loc_orig`). */
export const cellOrigin = (cell: number): number => CELL_ORIGINS[cell] ?? 0;

/** The grid with cell `cell` moved by `step` (offset and sprite coordinate). */
const moveCell = (formation: Formation, cell: number, step: number): Formation => {
  const mask = cell < COLUMNS ? 0xff : 0x1ff;
  return {
    ...formation,
    offsets: formation.offsets.map((v, i) => (i === cell ? (v + step) & 0xff : v)),
    spriteCoords: formation.spriteCoords.map((v, i) => (i === cell ? (v + step) & mask : v)),
  };
};

/** What the sway did in a frame. */
export interface SwayResult {
  readonly formation: Formation;
  /** The grid is back in the middle after the last wave: breathing starts now. */
  readonly settled: boolean;
}

/**
 * `f_2A90`: while the waves enter, the grid sways left and right by 32 pixels, one pixel every
 * 4 frames. Once all aliens are home (`settled` asked), it stops when back in the middle.
 */
export const swayFormation = (
  formation: Formation,
  frame: number,
  stopInMiddle: boolean,
): SwayResult => {
  if (((frame - 1) & 3) !== 0) return { formation, settled: false };
  const step = formation.direction === 0 ? 1 : -1;
  const moved = Array.from({ length: COLUMNS }, (_, i) => i).reduce(
    (current, cell) => moveCell(current, cell, step),
    formation,
  );
  const first = moved.offsets[0] ?? 0;
  if (stopInMiddle && first === 0) {
    return { formation: { ...moved, direction: 0 }, settled: true };
  }
  if (first === 0x20) return { formation: { ...moved, direction: 1 }, settled: false };
  if (first === 0xe0) return { formation: { ...moved, direction: 0 }, settled: false };
  return { formation: moved, settled: false };
};

/** `c_1E43`: moves the cells whose bitmap bit comes out set, rotating each bitmap byte. */
const breatheCells = (formation: Formation, cells: readonly number[], step: number): Formation =>
  cells.reduce((current, cell) => {
    const bits = current.bitmap[cell] ?? 0;
    const rotated = {
      ...current,
      bitmap: current.bitmap.map((v, i) => (i === cell ? ((bits >> 1) | (bits << 7)) & 0xff : v)),
    };
    return (bits & 1) === 1 ? moveCell(rotated, cell, step) : rotated;
  }, formation);

/** Left columns, and right columns with the rows: they move the opposite way. */
const LEFT_CELLS = [0, 1, 2, 3, 4] as const;
const OTHER_CELLS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const;

/** The next value of the breathing counter: 0 up to $1F, then $A0 down to $81, and again. */
const nextCounter = (counter: number): number => {
  const stepped = (counter & 0x80) !== 0 ? counter - 1 : counter + 1;
  if (counter === 0x1f) return stepped | 0x80;
  if (counter === 0x81) return stepped & 0x7f;
  return stepped;
};

/**
 * `f_1DE6`: once the attacks start, the grid "breathes": every 4 frames some cells move one
 * pixel outwards (or inwards). The outer columns and the lower rows move more often, chosen by
 * one of four bitmaps that changes every 32 frames, in time with the flapping of the wings.
 */
export const breatheFormation = (formation: Formation, frame: number): Formation => {
  if ((frame & 3) !== 0) return formation;
  const previous = formation.direction;
  const counter = nextCounter(previous);
  const row = (counter & 0x18) * 2;
  const withBitmap =
    (previous & 7) === 0
      ? { ...formation, bitmap: BREATHING_BITMAPS.slice(row, row + 16) }
      : formation;
  const closing = (previous & 0x80) !== 0;
  const left = breatheCells({ ...withBitmap, direction: counter }, LEFT_CELLS, closing ? 1 : -1);
  return breatheCells(left, OTHER_CELLS, closing ? -1 : 1);
};
