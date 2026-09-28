import { arcadeFont, drawSprite, drawText, type DrawingContext } from '@arcade/render';
import type { Alien } from './aliens';
import { CANNON_Y } from './cannon';
import { colors } from './palette';
import type { PlayingState } from './playing';
import { formatScore } from './score';
import { alienSprites, cannonSprite, explosionSprite, shotSprite } from './sprites';

/** Vertical position of the green ground line under the cannon. */
const GROUND_Y = 239;

/** Draws the score header at the top of the screen. */
const renderScore = (ctx: DrawingContext, score: number): void => {
  drawText(ctx, arcadeFont, 'SCORE<1>', 8, 8, colors.text);
  drawText(ctx, arcadeFont, formatScore(score), 24, 20, colors.text);
};

/** Draws one invader. */
const renderAlien = (ctx: DrawingContext, alien: Alien): void => {
  drawSprite(ctx, alienSprites[alien.kind][0], alien.x, alien.y, colors.aliens);
};

/** Draws the ground line and the cannon standing on it. */
const renderCannon = (ctx: DrawingContext, state: PlayingState): void => {
  ctx.fillStyle = colors.cannon;
  ctx.fillRect(0, GROUND_Y, ctx.canvas.width, 1);
  drawSprite(ctx, cannonSprite, state.cannon.x, CANNON_Y, colors.cannon);
};

/** Draws the playfield: score, invaders, explosions, shot and cannon. */
export const renderPlaying = (ctx: DrawingContext, state: PlayingState): void => {
  renderScore(ctx, state.score);
  state.aliens.forEach((alien) => {
    renderAlien(ctx, alien);
  });
  state.explosions.forEach((explosion) => {
    drawSprite(ctx, explosionSprite, explosion.x, explosion.y, colors.aliens);
  });
  if (state.shot) drawSprite(ctx, shotSprite, state.shot.x, state.shot.y, colors.text);
  renderCannon(ctx, state);
};
