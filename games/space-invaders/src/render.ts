import { clearScreen, type DrawingContext } from '@arcade/render';
import type { GameState } from './game';
import { paletteFor } from './palette';
import { renderAttract } from './render-attract';
import { renderHeader } from './render-hud';
import { renderGameOver, renderPlaying } from './render-playing';

/** Draws the whole game. The canvas context is the only thing it changes. */
export const renderGame = (ctx: DrawingContext, state: GameState): void => {
  const palette = paletteFor(state.colorMode);
  clearScreen(ctx, palette.background);
  switch (state.screen) {
    case 'attract':
      // As on the cabinet, the scores stay on top of the attract screen: the saved record shows.
      renderHeader(ctx, 0, state.hiScore, palette);
      renderAttract(ctx, state.attract, palette);
      break;
    case 'playing':
      renderPlaying(ctx, state.playing, state.hiScore, palette);
      break;
    case 'gameOver':
      renderGameOver(ctx, state.playing, state.hiScore, palette);
      break;
  }
};
