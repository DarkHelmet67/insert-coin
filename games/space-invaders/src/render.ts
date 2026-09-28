import { isInsertCoinVisible, type AttractState } from './attract';
import { CANNON_WIDTH, type CannonState } from './cannon';
import type { GameState } from './game';

/** Vertical position of the cannon's top edge, in screen pixels. */
const CANNON_Y = 216;

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

/** Draws the attract screen. */
const renderAttract = (ctx: CanvasRenderingContext2D, state: AttractState): void => {
  if (isInsertCoinVisible(state)) drawCenteredText(ctx, 'INSERT COIN', ctx.canvas.height / 2);
};

/** Draws the cannon as a green block: a placeholder until the sprites of guide 04. */
const renderCannon = (ctx: CanvasRenderingContext2D, cannon: CannonState): void => {
  ctx.fillStyle = '#20ff20';
  ctx.fillRect(Math.round(cannon.x), CANNON_Y, CANNON_WIDTH, 8);
};

/** Draws the whole game. The canvas context is the only thing it changes. */
export const renderGame = (ctx: CanvasRenderingContext2D, state: GameState): void => {
  clearScreen(ctx);
  switch (state.screen) {
    case 'attract':
      renderAttract(ctx, state.attract);
      break;
    case 'playing':
      renderCannon(ctx, state.cannon);
      break;
  }
};
