import { ATARI_GLYPHS } from './atari-glyphs';
import { shapeEnd, shapeToLines, type BeamLine, type VectorShape } from './shape';

/** A vector font: each glyph is a shape that ends where the next glyph begins. */
export interface VectorFont {
  readonly glyphs: ReadonlyMap<string, VectorShape>;
  /** Height of the capital letters, at scale 1. */
  readonly glyphHeight: number;
  /** Distance from one glyph to the next, used for characters the font does not have. */
  readonly advance: number;
  /** Empty space after the last glyph, left out when measuring a text. */
  readonly spacing: number;
}

/** The character set of the Atari vector games: capital letters, digits, space and ©. */
export const atariVectorFont: VectorFont = {
  glyphs: new Map(Object.entries(ATARI_GLYPHS)),
  glyphHeight: 12,
  advance: 12,
  spacing: 4,
};

/** Where and how big a text is written: (`x`, `y`) is the bottom-left corner of the first glyph. */
export interface TextPlacement {
  readonly x: number;
  readonly y: number;
  readonly scale?: number;
}

/** The shape of one character; unknown characters become a blank move of one advance. */
const glyphFor = (font: VectorFont, char: string): VectorShape =>
  font.glyphs.get(char) ?? [[font.advance, 0, 0]];

/**
 * The whole text as one shape, glyph after glyph. Vector fonts are uppercase only: lowercase
 * letters are converted.
 */
export const textShape = (font: VectorFont, text: string): VectorShape =>
  [...text.toUpperCase()].flatMap((char) => glyphFor(font, char));

/** The lines that write `text` at `placement`. */
export const textToLines = (
  font: VectorFont,
  text: string,
  placement: TextPlacement,
): readonly BeamLine[] => shapeToLines(textShape(font, text), placement);

/** Width of `text` at scale 1, from the left edge of the first glyph to the right of the last. */
export const vectorTextWidth = (font: VectorFont, text: string): number =>
  text.length === 0 ? 0 : shapeEnd(textShape(font, text)).dx - font.spacing;
