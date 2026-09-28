import { drawSprite, type DrawingContext } from './draw';
import { parseSprite, type Sprite } from './sprite';

/** A bitmap font: every character is a small sprite of the same size. */
export interface PixelFont {
  readonly glyphWidth: number;
  readonly glyphHeight: number;
  /** Empty pixels between two characters. */
  readonly spacing: number;
  readonly glyphs: ReadonlyMap<string, Sprite>;
}

/** Source of a font: each character mapped to its rows of sprite art. */
export type FontDefinition = Readonly<Record<string, readonly string[]>>;

/**
 * Builds a font from its sprite art.
 * @throws Error when a glyph is not `glyphWidth` × `glyphHeight` pixels.
 */
export const createPixelFont = (
  definition: FontDefinition,
  {
    glyphWidth,
    glyphHeight,
    spacing = 1,
  }: { readonly glyphWidth: number; readonly glyphHeight: number; readonly spacing?: number },
): PixelFont => {
  const glyphs = new Map(
    Object.entries(definition).map(([char, rows]) => {
      const glyph = parseSprite(rows);
      if (glyph.width !== glyphWidth || glyph.height !== glyphHeight) {
        throw new Error(
          `Glyph "${char}" must be ${String(glyphWidth)}x${String(glyphHeight)} pixels`,
        );
      }
      return [char, glyph] as const;
    }),
  );
  return { glyphWidth, glyphHeight, spacing, glyphs };
};

/** Width in pixels of `text` written with `font`. */
export const textWidth = (font: PixelFont, text: string): number =>
  text.length === 0 ? 0 : text.length * (font.glyphWidth + font.spacing) - font.spacing;

/**
 * Writes `text` with its top-left corner at (`x`, `y`).
 * Arcade fonts are uppercase only: lowercase letters are converted, unknown characters are left blank.
 */
export const drawText = (
  ctx: DrawingContext,
  font: PixelFont,
  text: string,
  x: number,
  y: number,
  color: string,
): void => {
  [...text.toUpperCase()].forEach((char, index) => {
    const glyph = font.glyphs.get(char);
    if (glyph) drawSprite(ctx, glyph, x + index * (font.glyphWidth + font.spacing), y, color);
  });
};

/** Writes `text` centered horizontally on the screen, with its top at `y`. */
export const drawCenteredText = (
  ctx: DrawingContext,
  font: PixelFont,
  text: string,
  y: number,
  color: string,
): void => {
  drawText(ctx, font, text, Math.floor((ctx.canvas.width - textWidth(font, text)) / 2), y, color);
};
