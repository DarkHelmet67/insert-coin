import { isInsertCoinVisible, type AttractState } from './attract';

/** Fills the whole screen with black, like a switched-off CRT. */
const clearScreen = (ctx: CanvasRenderingContext2D): void => {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

/** Writes white text centered horizontally at height `y`. */
const drawCenteredText = (ctx: CanvasRenderingContext2D, text: string, y: number): void => {
  ctx.fillStyle = '#fff';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, ctx.canvas.width / 2, y);
};

/** Draws the attract screen. The canvas context is the only thing it changes. */
export const renderAttract = (ctx: CanvasRenderingContext2D, state: AttractState): void => {
  clearScreen(ctx);
  if (isInsertCoinVisible(state)) drawCenteredText(ctx, 'INSERT COIN', ctx.canvas.height / 2);
};
