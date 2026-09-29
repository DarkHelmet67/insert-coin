import { clamp } from '@arcade/math';
import type { Controls } from './controls';
import { RIGHT_WALL_X, SIDE_WALL_WIDTH } from './playfield';
import { tuning } from './tuning.config';

/** Width of the full paddle, in scan lines [C]; it halves after a breakout (later step). */
export const PADDLE_WIDTH = 16;

/** The paddle: its left edge and its width. It always sits on the paddle row (`PADDLE_Y`). */
export interface Paddle {
  readonly x: number;
  readonly width: number;
}

/** The paddle at the start: full width, in the middle. */
export const initialPaddle: Paddle = {
  x: Math.round((SIDE_WALL_WIDTH + RIGHT_WALL_X - PADDLE_WIDTH) / 2),
  width: PADDLE_WIDTH,
};

/** Keeps the paddle between the side walls [N: the original's knob range is not known]. */
const keepInside = (x: number, width: number): number =>
  clamp(Math.round(x), SIDE_WALL_WIDTH, RIGHT_WALL_X - width);

/**
 * Moves the paddle for one frame. The mouse or finger places its center where the pointer is,
 * as the knob placed it on the cabinet; without pointer movement the arrow keys push it.
 */
export const movePaddle = (paddle: Paddle, { pointerX, direction }: Controls): Paddle => {
  const x =
    pointerX === undefined
      ? paddle.x + direction * tuning.paddleKeySpeed
      : pointerX - paddle.width / 2;
  return { ...paddle, x: keepInside(x, paddle.width) };
};
