import { arcadeFont, clearScreen, drawCenteredText, type DrawingContext } from '@arcade/render';
import {
  RIGHT_WALL_X,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  SIDE_WALL_WIDTH,
  TOP_WALL_HEIGHT,
} from './playfield';

/** Color of everything the monochrome monitor draws. */
const WHITE = '#fff';

/** Draws the three walls that enclose the playfield. */
export const renderWalls = (ctx: DrawingContext): void => {
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, SCREEN_WIDTH, TOP_WALL_HEIGHT);
  ctx.fillRect(0, 0, SIDE_WALL_WIDTH, SCREEN_HEIGHT);
  ctx.fillRect(RIGHT_WALL_X, 0, SIDE_WALL_WIDTH, SCREEN_HEIGHT);
};

/** Placeholder screen shown while the game is being built. */
export const renderPlaceholder = (ctx: DrawingContext): void => {
  clearScreen(ctx, '#000');
  renderWalls(ctx);
  drawCenteredText(ctx, arcadeFont, 'BREAKOUT', 90, WHITE);
  drawCenteredText(ctx, arcadeFont, 'COMING SOON', 110, WHITE);
};
