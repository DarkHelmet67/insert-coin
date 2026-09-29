import { rectsOverlap, type Rect } from '@arcade/collision';
import { clamp } from '@arcade/math';
import type { Paddle } from './paddle';
import {
  BALL_HEIGHT,
  BALL_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_Y,
  RIGHT_WALL_X,
  SCREEN_HEIGHT,
  SIDE_WALL_WIDTH,
  TOP_WALL_HEIGHT,
} from './playfield';
import { speedFor, type SpeedState } from './speed';

/**
 * The ball in play. Like the circuit, it stores directions and a few flags, not a velocity:
 * the speed is derived from the flags at every frame (see `speedFor`).
 */
export interface Ball extends SpeedState {
  /** Top-left corner, in scan lines and steps. */
  readonly x: number;
  readonly y: number;
  /** -1 left, 1 right. */
  readonly dirX: -1 | 1;
  /** -1 up (towards the bricks), 1 down (towards the paddle). */
  readonly dirY: -1 | 1;
  /** False after a brick hit, until the paddle or the top wall: one brick per trip. */
  readonly canHitBrick: boolean;
}

/** The rectangle the ball occupies. */
export const ballRect = ({ x, y }: Ball): Rect => ({
  x,
  y,
  width: BALL_WIDTH,
  height: BALL_HEIGHT,
});

/** Moves the ball by one frame at its current speed. */
export const moveBall = (ball: Ball): Ball => {
  const { vertical, sideways } = speedFor(ball);
  return { ...ball, x: ball.x + ball.dirX * sideways, y: ball.y + ball.dirY * vertical };
};

/** Bounces the ball off the side walls and the top wall. */
export const bounceOffWalls = (ball: Ball): Ball => {
  if (ball.x <= SIDE_WALL_WIDTH) return { ...ball, x: SIDE_WALL_WIDTH, dirX: 1 };
  if (ball.x + BALL_WIDTH >= RIGHT_WALL_X) {
    return { ...ball, x: RIGHT_WALL_X - BALL_WIDTH, dirX: -1 };
  }
  if (ball.y <= TOP_WALL_HEIGHT) {
    return { ...ball, y: TOP_WALL_HEIGHT, dirY: 1, canHitBrick: true };
  }
  return ball;
};

/** Whether the ball touches the top wall in this frame: the paddle shrinks to half. */
export const touchesTopWall = (ball: Ball): boolean => ball.y <= TOP_WALL_HEIGHT;

/**
 * Which quarter of the paddle the ball's center is over: 0 and 3 are the outer segments.
 * On a half paddle the segments are half as wide, as in the circuit.
 */
export const paddleSegment = (ball: Ball, paddle: Paddle): number =>
  clamp(Math.floor(((ball.x + BALL_WIDTH / 2 - paddle.x) * 4) / paddle.width), 0, 3);

/**
 * Returns the ball after the paddle, if it hits it while coming down: it goes back up, to the
 * side of the half it touched, at a flatter angle off the outer segments. Every hit counts
 * towards the speed-ups.
 */
export const bounceOffPaddle = (ball: Ball, paddle: Paddle): Ball => {
  const paddleRect = { x: paddle.x, y: PADDLE_Y, width: paddle.width, height: PADDLE_HEIGHT };
  if (ball.dirY !== 1 || !rectsOverlap(ballRect(ball), paddleRect)) return ball;
  const segment = paddleSegment(ball, paddle);
  return {
    ...ball,
    y: PADDLE_Y - BALL_HEIGHT,
    dirX: segment < 2 ? -1 : 1,
    dirY: -1,
    outer: segment === 0 || segment === 3,
    hits: ball.hits + 1,
    canHitBrick: true,
  };
};

/** Whether the ball has left the bottom of the screen. */
export const isLost = (ball: Ball): boolean => ball.y >= SCREEN_HEIGHT;
