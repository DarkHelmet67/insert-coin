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
}

/** Sprite y of a row origin: the "$0160 - 2n" of `c_12C3`. */
const rowSpriteY = (origin: number): number => ((~(origin + 0x4f) & 0xff) << 1) & 0x1ff;

/** `c_12C3`: the grid at its origin, as each stage starts. */
export const initialFormation = (): Formation => ({
  offsets: CELL_ORIGINS.map(() => 0),
  spriteCoords: CELL_ORIGINS.map((origin, cell) => (cell < COLUMNS ? origin : rowSpriteY(origin))),
});

/** Origin of a cell (`ds_hpos_loc_orig`). */
export const cellOrigin = (cell: number): number => CELL_ORIGINS[cell] ?? 0;
