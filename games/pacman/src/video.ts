/** Cells of video RAM: the 28 × 36 tiles of the screen, plus 16 the monitor never shows. */
export const VIDEO_SIZE = 0x400;

/** Columns and rows of the screen, as the vertical monitor shows them. */
export const COLUMNS = 28;
export const ROWS = 36;

/**
 * The screen's two kilobytes of RAM: one tile code ($4000-$43FF) and one color ($4400-$47FF)
 * per cell. The program reads them back too: a wall is a tile code, a tunnel is a color.
 */
export interface Video {
  readonly tiles: readonly number[];
  readonly colors: readonly number[];
}

/** One change to a cell: its address (0-$3FF) and the tile code or color it gets. */
export interface CellWrite {
  readonly address: number;
  readonly value: number;
}

/** Changes to the tile codes and to the colors, applied together. */
export interface VideoWrites {
  readonly tiles?: readonly CellWrite[];
  readonly colors?: readonly CellWrite[];
}

/** A video RAM where every cell holds `tile` in color `color`. */
export const filledVideo = (tile: number, color: number): Video => ({
  tiles: Array.from({ length: VIDEO_SIZE }, () => tile),
  colors: Array.from({ length: VIDEO_SIZE }, () => color),
});

/**
 * The address of the cell at `column` (0-27, left to right) and `row` (0-35, top to bottom).
 * The monitor lies on its side, so the playfield (rows 2-33) is stored column by column from
 * the right, 32 cells each from $040; the two score rows at the top ($3C0) and the two at the
 * bottom ($000) are stored row by row, again from the right, skipping 2 hidden cells per side.
 */
export const cellAddress = (column: number, row: number): number => {
  const fromRight = COLUMNS - 1 - column;
  if (row < 2) return 0x3c2 + row * 0x20 + fromRight;
  if (row >= ROWS - 2) return 0x002 + (row - (ROWS - 2)) * 0x20 + fromRight;
  return 0x40 + fromRight * 0x20 + (row - 2);
};

/** `values` with the writes applied; the last write to an address wins. */
const applyWrites = (
  values: readonly number[],
  writes: readonly CellWrite[],
): readonly number[] => {
  if (writes.length === 0) return values;
  const changed = new Map(writes.map((write) => [write.address & 0x3ff, write.value]));
  return values.map((value, address) => changed.get(address) ?? value);
};

/** `video` with `writes` applied. */
export const writeVideo = (video: Video, writes: VideoWrites): Video => ({
  tiles: applyWrites(video.tiles, writes.tiles ?? []),
  colors: applyWrites(video.colors, writes.colors ?? []),
});

/** The same `value` written to `length` consecutive cells from `start`. */
export const fillCells = (start: number, length: number, value: number): readonly CellWrite[] =>
  Array.from({ length }, (_, i) => ({ address: start + i, value }));
