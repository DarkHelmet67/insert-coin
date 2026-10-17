import type { DrawingContext } from '@arcade/render';
import { drawArt } from '@arcade/tiles';
import { badgeColumns, BADGES_RIGHT, stageFlags } from './badges';
import type { Message } from './messages';
import { charColors } from './palette';
import { charArt } from './sprite-rom';
import { CELL, drawCellText } from './text';

/** Draws one character at a cell. */
const drawChar = (
  ctx: DrawingContext,
  code: number,
  column: number,
  row: number,
  palette: number,
): void => {
  drawArt(ctx, charArt(code), column * CELL, row * CELL, charColors(palette));
};

/** The texts of the main program. */
export const drawMessages = (ctx: DrawingContext, messages: readonly Message[]): void => {
  messages.forEach((m) => {
    drawCellText(ctx, m.text, m.column, m.row, m.palette);
  });
};

/** Rows of the bottom status lines. */
const BOTTOM_ROW = 34;

/** The stage badges in the bottom right corner, the first `shown` of them. */
export const drawBadges = (ctx: DrawingContext, stage: number, shown: number): void => {
  const all = badgeColumns(stage, stageFlags(stage).length).length;
  const left = BADGES_RIGHT + 1 - all;
  badgeColumns(stage, shown).forEach((column, i) => {
    drawChar(ctx, column.top, left + i, BOTTOM_ROW, column.palette);
    drawChar(ctx, column.bottom, left + i, BOTTOM_ROW + 1, column.palette);
  });
};

/** Characters of a reserve fighter: top left, top right, bottom left, bottom right. */
const RESERVE_CHARS = [0x4a, 0x4b, 0x4c, 0x4d] as const;
/** At most 5 reserve fighters are shown, two columns each. */
const RESERVE_SHOWN = 5;
/** The bottom rows keep the palette written at power-up (`j_Game_init`). */
const BOTTOM_PALETTE = 3;

/** `draw_resv_ships`: the fighters in reserve at the bottom left. */
export const drawReserve = (ctx: DrawingContext, reserve: number): void => {
  Array.from({ length: Math.min(reserve, RESERVE_SHOWN) }, (_, i) => i * 2).forEach((column) => {
    RESERVE_CHARS.forEach((code, k) => {
      drawChar(ctx, code, column + (k & 1), BOTTOM_ROW + (k >> 1), BOTTOM_PALETTE);
    });
  });
};
