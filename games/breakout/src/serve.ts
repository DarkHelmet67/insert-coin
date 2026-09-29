import type { Ball } from './ball';
import { BALL_WIDTH, RIGHT_WALL_X, SIDE_WALL_WIDTH } from './playfield';
import { tuning } from './tuning.config';

/**
 * Frames between pressing SERVE and the ball showing up. In the circuit the ball keeps
 * circling, invisible, and appears when it next crosses the middle of the screen: anywhere
 * from at once to about 4 seconds later, depending on when the button is pressed.
 */
export const serveDelay = (clock: number): number => {
  const cycle = tuning.serve.cycleFrames;
  return (cycle - (clock % cycle)) % cycle;
};

/** How far the ball can be from the left wall when it appears. */
const SERVE_RANGE = RIGHT_WALL_X - SIDE_WALL_WIDTH - BALL_WIDTH;

/**
 * The ball as it appears after a serve, going down towards the paddle at the slowest speed.
 * Its position and sideways direction were whatever the hidden ball had at that moment: the
 * remake derives them from the frame counter at the press, which is just as unpredictable.
 */
export const servedBall = (pressedAt: number): Ball => ({
  x: SIDE_WALL_WIDTH + (pressedAt % SERVE_RANGE),
  y: tuning.serve.appearY,
  dirX: pressedAt % 2 === 0 ? 1 : -1,
  dirY: 1,
  hits: 0,
  fast: false,
  outer: pressedAt % 4 >= 2,
  canHitBrick: true,
});
