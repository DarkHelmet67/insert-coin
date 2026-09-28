import { arcadeFont, drawSprite, drawText, type DrawingContext } from '@arcade/render';
import { colors } from './palette';
import { GROUND_Y } from './playfield';
import { formatScore } from './score';
import { cannonSprite } from './sprites';

/** Left edge of the "HI-SCORE" column in the header. */
const HI_SCORE_X = 88;

/** Top of the bottom line with the reserve cannons, below the ground. */
const RESERVE_Y = GROUND_Y + 4;

/** Draws the header: the player's score and the best score. */
export const renderHeader = (ctx: DrawingContext, score: number, hiScore: number): void => {
  drawText(ctx, arcadeFont, 'SCORE<1>', 8, 8, colors.text);
  drawText(ctx, arcadeFont, formatScore(score), 24, 20, colors.text);
  drawText(ctx, arcadeFont, 'HI-SCORE', HI_SCORE_X, 8, colors.text);
  drawText(ctx, arcadeFont, formatScore(hiScore), HI_SCORE_X + 16, 20, colors.text);
};

/**
 * Draws the green ground line and, under it, the cannons left: a number plus one icon for
 * every cannon waiting after the one in play, as on the original.
 */
export const renderGroundAndLives = (ctx: DrawingContext, lives: number): void => {
  ctx.fillStyle = colors.cannon;
  ctx.fillRect(0, GROUND_Y, ctx.canvas.width, 1);
  drawText(ctx, arcadeFont, String(lives), 8, RESERVE_Y, colors.cannon);
  Array.from({ length: Math.max(0, lives - 1) }, (_, index) => {
    drawSprite(ctx, cannonSprite, 24 + index * 16, RESERVE_Y, colors.cannon);
  });
};
