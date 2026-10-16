import type { DrawingContext } from '@arcade/render';
import { drawArt } from '@arcade/tiles';
import { charColors } from './palette';
import { charArt } from './sprite-rom';

/** Side of a character cell: the screen is a grid of 28 × 36 cells of 8 × 8 pixels. */
export const CELL = 8;

/**
 * Character codes of the symbols in the ROM font. Digits are codes 0-9 and letters follow from
 * 0x0A: the original program writes its strings in ASCII and subtracts 0x30 or 0x37.
 */
const SYMBOLS: Readonly<Record<string, number>> = {
  ' ': 0x24,
  '-': 0x26,
  '%': 0x29,
  '.': 0x2a,
  '!': 0x2c,
  '©': 0x2e,
};

/** The character code that shows `char`; unknown characters are blank. */
export const charCode = (char: string): number => {
  if (char >= '0' && char <= '9') return char.charCodeAt(0) - 0x30;
  if (char >= 'A' && char <= 'Z') return char.charCodeAt(0) - 0x37;
  return SYMBOLS[char] ?? 0x24;
};

/**
 * Writes `text` from the cell at column `column` and row `row`, in character palette `palette`
 * (the color byte the original program puts before each of its strings).
 */
export const drawCellText = (
  ctx: DrawingContext,
  text: string,
  column: number,
  row: number,
  palette: number,
): void => {
  const colors = charColors(palette);
  [...text.toUpperCase()].forEach((char, index) => {
    drawArt(ctx, charArt(charCode(char)), (column + index) * CELL, row * CELL, colors);
  });
};
