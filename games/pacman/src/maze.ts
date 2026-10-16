import { DOT_STEPS, MAZE_DRAWING } from './rom/main-rom';
import { fillCells, VIDEO_SIZE, type CellWrite, type VideoWrites } from './video';

/** Tile codes of the playfield. */
export const TILE = { space: 0x40, dot: 0x10, energizer: 0x14 } as const;

/** Whether a tile code is a piece of wall: the maze tiles are $C0-$FF. */
export const isWall = (tile: number): boolean => (tile & 0xc0) === 0xc0;

/** Addresses of the four energizers (routine $2448). */
export const ENERGIZER_ADDRESSES = [0x064, 0x078, 0x384, 0x398] as const;

/**
 * The cell on the other side of the vertical axis. The maze is symmetric, so the ROM stores only
 * its left half: $2419 writes each tile twice, here and at 0x3E0 + 2 × row − address.
 */
export const mirrorAddress = (address: number): number => 0x3e0 + 2 * (address & 0x1f) - address;

/** Where the drawing routine is in the data: next byte, last cell written, and its writes. */
interface DrawingCursor {
  readonly index: number;
  readonly address: number;
  readonly writes: readonly CellWrite[];
}

/**
 * One step of routine $2419. A byte with bit 7 set is a wall tile for the next cell; a smaller
 * byte n skips n − 1 cells and the byte after it is the tile. Every wall tile is written with
 * its mirror image (tile code xor 1) on the other half of the screen.
 */
const drawStep = (data: readonly number[], cursor: DrawingCursor): DrawingCursor => {
  const byte = data[cursor.index] ?? 0;
  const skipped = byte < 0x80;
  const tile = skipped ? (data[cursor.index + 1] ?? 0) : byte;
  const address = cursor.address + (skipped ? byte : 1);
  return {
    index: cursor.index + (skipped ? 2 : 1),
    address,
    writes: [
      ...cursor.writes,
      { address, value: tile },
      { address: mirrorAddress(address), value: tile ^ 1 },
    ],
  };
};

/** Runs the drawing steps until the end mark 0. */
const drawFrom = (data: readonly number[], cursor: DrawingCursor): readonly CellWrite[] =>
  (data[cursor.index] ?? 0) === 0 ? cursor.writes : drawFrom(data, drawStep(data, cursor));

/** The wall tiles of the maze, decoded from the compressed data at $3435 (routine $2419). */
export const mazeWrites = (data: readonly number[] = MAZE_DRAWING): readonly CellWrite[] =>
  drawFrom(data, { index: 0, address: 0, writes: [] });

/**
 * The cells holding a dot (routine $2448): the ROM lists the distance from each dot cell to
 * the next, 240 of them starting from address 0, then the four energizers.
 */
export const dotWrites = (steps: readonly number[] = DOT_STEPS): readonly CellWrite[] => [
  ...steps
    .reduce<readonly number[]>(
      (addresses, step) => [...addresses, (addresses.at(-1) ?? 0) + step],
      [],
    )
    .map((address) => ({ address, value: TILE.dot })),
  ...ENERGIZER_ADDRESSES.map((address) => ({ address, value: TILE.energizer })),
];

/** Special colors of the playfield, that the program reads back to know where it is. */
export const COLOR = {
  /** The maze, and the dots in it. */
  maze: 0x10,
  /** The maze flashing white at the end of a level. */
  white: 0x1f,
  /** The ghost house door. */
  door: 0x18,
  /** Where ghosts cannot choose to turn up (above the house and above Pac-Man's start). */
  noUp: 0x1a,
  /** The tunnels, where ghosts slow down. */
  tunnel: 0x1b,
  /** The score rows at the top. */
  score: 0x0f,
} as const;

/** The cells of `columns` (counted from the right) at `rows` offsets in each column. */
const zoneCells = (firstColumn: number, columns: number, rows: readonly number[], value: number) =>
  Array.from({ length: columns }, (_, column) =>
    rows.map((row) => ({ address: 0x40 + (firstColumn + column) * 0x20 + row, value })),
  ).flat();

/**
 * The colors of the playfield (routine $24D7). `white` paints the maze for the end-of-level
 * flash; otherwise `zones` adds the cells the ghosts recognize by color: no-up zones, tunnels,
 * door. They look the same as the maze, the palette PROM gives them the same colors.
 */
export const mazeColorWrites = (white: boolean, zones: boolean): readonly CellWrite[] => [
  ...fillCells(0x40, VIDEO_SIZE - 0x80, white ? COLOR.white : COLOR.maze),
  ...fillCells(0x3c0, 0x40, COLOR.score),
  ...(zones
    ? [
        ...zoneCells(11, 6, [12, 24], COLOR.noUp),
        ...zoneCells(0, 5, [14, 15, 16], COLOR.tunnel),
        ...zoneCells(23, 5, [14, 15, 16], COLOR.tunnel),
        { address: 0x1ed, value: COLOR.door },
        { address: 0x20d, value: COLOR.door },
      ]
    : []),
];

/** A new playfield: walls, all the dots and the colors, as at the start of a level. */
export const newMazeWrites = (): VideoWrites => ({
  tiles: [...mazeWrites(), ...dotWrites()],
  colors: mazeColorWrites(false, true),
});
