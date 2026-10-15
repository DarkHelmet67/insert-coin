import { clearScreen, type DrawingContext } from '@arcade/render';
import { drawScores, TEXT_COLOR } from './draw-hud';
import { drawObjects } from './draw-objects';
import { drawStars } from './draw-stars';
import type { GameState } from './game';
import { drawCellText } from './text';

/** Draws the whole screen: stars at the back, then sprites, then characters on top. */
export const renderGame = (ctx: DrawingContext, state: GameState): void => {
  clearScreen(ctx);
  switch (state.screen) {
    case 'attract':
      drawStars(ctx, state.stars, state.frame);
      drawScores(ctx, 0, state.hiScore, false);
      drawCellText(ctx, 'GALAGA', 11, 4, TEXT_COLOR.blue);
      drawCellText(ctx, 'PUSH START BUTTON', 6, 13, TEXT_COLOR.blue);
      drawCellText(ctx, '© 1981 NAMCO LTD.', 6, 29, TEXT_COLOR.white);
      break;
    case 'playing': {
      const { playing } = state;
      drawStars(ctx, playing.stars, playing.frame);
      drawObjects(ctx, playing.objects);
      drawScores(ctx, playing.score, state.hiScore, ((playing.frame >> 4) & 1) === 1);
      break;
    }
  }
};
