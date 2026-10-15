import { clearScreen, type DrawingContext } from '@arcade/render';
import { drawAttract } from './draw-attract';
import { drawScores } from './draw-hud';
import { drawObjects } from './draw-objects';
import { drawStars } from './draw-stars';
import { drawBeam } from './draw-beam';
import { drawBadges, drawMessages, drawReserve } from './draw-texts';
import type { GameState } from './game';

/** Draws the whole screen: stars at the back, then sprites, then characters on top. */
export const renderGame = (ctx: DrawingContext, state: GameState): void => {
  clearScreen(ctx);
  switch (state.screen) {
    case 'attract':
      drawAttract(ctx, state.attract);
      drawScores(ctx, 0, state.hiScore, false);
      break;
    case 'playing': {
      const { playing } = state;
      drawStars(ctx, playing.stars, playing.frame);
      drawObjects(ctx, playing.objects);
      drawBeam(ctx, playing.capture, playing.frame);
      drawMessages(ctx, playing.messages);
      drawBadges(ctx, playing.stage, playing.badges);
      drawReserve(ctx, playing.reserve);
      drawScores(ctx, playing.score, state.hiScore, ((playing.frame >> 4) & 1) === 1);
      break;
    }
  }
};
