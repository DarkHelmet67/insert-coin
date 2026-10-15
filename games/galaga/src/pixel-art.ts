import { parseSprite, PIXEL_ON, type Sprite } from '@arcade/render';

/**
 * One graphics tile of the ROMs as "ASCII art", one string per row: "." is a transparent pixel,
 * "1", "2" and "3" are the three colors that the tile takes from its palette when drawn.
 */
export type ArtRows = readonly string[];

/** The three pixel values that carry a color: 0 ("." in the art) is always transparent. */
const COLOR_VALUES = ['1', '2', '3'] as const;

/**
 * A tile ready to draw. Namco tiles have 4 values per pixel, while the shared `Sprite` is one bit
 * per pixel: so a tile becomes three monochrome sprites, one per color, drawn on top of each other.
 */
export interface PixelArt {
  readonly width: number;
  readonly height: number;
  /** The pixels of value 1, 2 and 3, in this order. */
  readonly layers: readonly [Sprite, Sprite, Sprite];
}

/** Turns the art of a tile into its three color layers. */
export const parseArt = (rows: ArtRows): PixelArt => {
  const [one, two, three] = COLOR_VALUES.map((value) =>
    parseSprite(rows.map((row) => row.replaceAll(value, PIXEL_ON))),
  ) as [Sprite, Sprite, Sprite];
  return { width: one.width, height: one.height, layers: [one, two, three] };
};

/** How the hardware mirrors a tile when drawing it. */
export interface Flip {
  /** Left and right swapped. */
  readonly x: boolean;
  /** Top and bottom swapped. */
  readonly y: boolean;
}

/** No mirroring: the tile as stored in the ROM. */
export const NO_FLIP: Flip = { x: false, y: false };

/** The art mirrored as `flip` says, the way the sprite hardware does it while drawing. */
export const flipArt = (rows: ArtRows, flip: Flip): ArtRows => {
  const columns = flip.x ? rows.map((row) => [...row].reverse().join('')) : rows;
  return flip.y ? [...columns].reverse() : columns;
};

/**
 * Four 16×16 tiles joined into one 32×32 picture, like the hardware does for "double size"
 * sprites (the big explosions).
 */
export const joinArt = (
  topLeft: ArtRows,
  topRight: ArtRows,
  bottomLeft: ArtRows,
  bottomRight: ArtRows,
): ArtRows => [
  ...topLeft.map((row, y) => row + (topRight[y] ?? '')),
  ...bottomLeft.map((row, y) => row + (bottomRight[y] ?? '')),
];
