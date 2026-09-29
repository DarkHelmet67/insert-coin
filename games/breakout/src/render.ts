import { clearScreen, type DrawingContext } from '@arcade/render';
import { brickPositions, brickShape, hasBrick, type Wall } from './bricks';
import { ballRect } from './ball';
import type { GameState } from './game';
import type { Paddle } from './paddle';
import { paletteFor } from './palette';
import {
  PADDLE_HEIGHT,
  PADDLE_Y,
  RIGHT_WALL_X,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  SIDE_WALL_WIDTH,
  TOP_WALL_HEIGHT,
} from './playfield';
import { renderFilm, type FilmContext } from './render-film';
import { isBlinkOn, renderHud } from './render-hud';

/** Draws the three walls that enclose the playfield. */
export const renderWalls = (ctx: DrawingContext, color: string): void => {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, SCREEN_WIDTH, TOP_WALL_HEIGHT);
  ctx.fillRect(0, 0, SIDE_WALL_WIDTH, SCREEN_HEIGHT);
  ctx.fillRect(RIGHT_WALL_X, 0, SIDE_WALL_WIDTH, SCREEN_HEIGHT);
};

/** Draws the bricks still standing. */
export const renderBricks = (ctx: DrawingContext, wall: Wall, color: string): void => {
  ctx.fillStyle = color;
  brickPositions()
    .filter((position) => hasBrick(wall, position))
    .forEach((position) => {
      const { x, y, width, height } = brickShape(position);
      ctx.fillRect(x, y, width, height);
    });
};

/** Draws the paddle on its row. */
export const renderPaddle = (ctx: DrawingContext, { x, width }: Paddle, color: string): void => {
  ctx.fillStyle = color;
  ctx.fillRect(x, PADDLE_Y, width, PADDLE_HEIGHT);
};

/** Draws the ball, if one is in play. */
const renderBall = (ctx: DrawingContext, state: GameState, color: string): void => {
  if (state.play.phase !== 'inPlay') return;
  const { x, y, width, height } = ballRect(state.play.ball);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
};

/**
 * Draws the whole game. Like the original, everything is drawn in the monitor's single color;
 * the colors come last, from the film laid on top.
 */
export const renderGame = (ctx: FilmContext, state: GameState): void => {
  const palette = paletteFor(state.colorMode);
  clearScreen(ctx, palette.background);
  // As on the cabinet, the score of the player up blinks while the game is on.
  const scoreVisible = state.play.phase === 'gameOver' || isBlinkOn(state.clock);
  renderHud(
    ctx,
    { player: 1, score: state.score, ball: state.ball, otherScore: 0, scoreVisible },
    palette.ink,
  );
  renderBricks(ctx, state.wall, palette.ink);
  renderWalls(ctx, palette.ink);
  renderPaddle(ctx, state.paddle, palette.ink);
  renderBall(ctx, state, palette.ink);
  renderFilm(ctx, palette.strips);
};
