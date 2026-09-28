import { clearScreen, type DrawingContext } from '@arcade/render';
import type { GameState } from './game';
import { colors } from './palette';
import { renderAttract } from './render-attract';
import { renderPlaying } from './render-playing';

/** Draws the whole game. The canvas context is the only thing it changes. */
export const renderGame = (ctx: DrawingContext, state: GameState): void => {
  clearScreen(ctx, colors.background);
  switch (state.screen) {
    case 'attract':
      renderAttract(ctx, state.attract);
      break;
    case 'playing':
      renderPlaying(ctx, state.playing);
      break;
  }
};
