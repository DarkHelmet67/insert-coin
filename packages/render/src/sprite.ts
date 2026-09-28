/**
 * A monochrome bitmap: the way 1970s arcade hardware stored graphics.
 * Each pixel is on or off; the color is chosen when drawing.
 */
export interface Sprite {
  readonly width: number;
  readonly height: number;
  /** Row-major pixels: `pixels[y * width + x]` is true when the pixel is on. */
  readonly pixels: readonly boolean[];
}

/** A horizontal run of consecutive lit pixels, drawn with a single rectangle. */
export interface PixelRun {
  readonly x: number;
  readonly y: number;
  readonly length: number;
}

/** Character that marks a lit pixel in sprite art; any other character is empty. */
export const PIXEL_ON = 'X';

/**
 * Builds a sprite from "ASCII art", one string per row, so sprites can be read and edited in code:
 * ```ts
 * parseSprite(['.X.', 'XXX']);
 * ```
 * @throws Error when the rows do not all have the same length.
 */
export const parseSprite = (rows: readonly string[]): Sprite => {
  const width = rows[0]?.length ?? 0;
  if (rows.some((row) => row.length !== width)) {
    throw new Error(`Sprite rows must all be ${String(width)} characters long`);
  }
  return {
    width,
    height: rows.length,
    pixels: rows.flatMap((row) => [...row].map((char) => char === PIXEL_ON)),
  };
};

/** Whether the pixel at (`x`, `y`) is lit; pixels outside the sprite are off. */
export const isPixelOn = (sprite: Sprite, x: number, y: number): boolean =>
  x >= 0 &&
  x < sprite.width &&
  y >= 0 &&
  y < sprite.height &&
  sprite.pixels[y * sprite.width + x] === true;

/** Counts the lit pixels starting at (`x`, `y`) and going right. */
const runLength = (sprite: Sprite, x: number, y: number): number =>
  isPixelOn(sprite, x, y) ? 1 + runLength(sprite, x + 1, y) : 0;

/** Splits one sprite row into runs of lit pixels: a run starts where a lit pixel follows an empty one. */
const rowRuns = (sprite: Sprite, y: number): readonly PixelRun[] =>
  Array.from({ length: sprite.width }, (_, x) => x)
    .filter((x) => isPixelOn(sprite, x, y) && !isPixelOn(sprite, x - 1, y))
    .map((x) => ({ x, y, length: runLength(sprite, x, y) }));

/**
 * Lists the sprite as horizontal runs of lit pixels.
 * Drawing one rectangle per run instead of one per pixel cuts the number of canvas calls several times.
 */
export const spriteRuns = (sprite: Sprite): readonly PixelRun[] =>
  Array.from({ length: sprite.height }, (_, y) => rowRuns(sprite, y)).flat();
