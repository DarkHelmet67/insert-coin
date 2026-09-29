import { FULL_ROW_WIDTH, type Paddle } from './paddle';
import { SIDE_WALL_WIDTH } from './playfield';
import { updateRound, type Round } from './play';

/**
 * The paddle of the attract mode: a whole row, as on the cabinet, so the ball bounces forever
 * and nobody has to play.
 */
export const attractPaddle: Paddle = { x: SIDE_WALL_WIDTH, width: FULL_ROW_WIDTH };

/**
 * One frame of the attract mode, while the cabinet waits for a player. The ball serves itself
 * and bounces off everything, but the bricks stay and the score stands still: the screen shows
 * the last game until the next one starts.
 */
export const updateAttract = (round: Round, clock: number): Round => ({
  ...updateRound(round, attractPaddle, true, clock),
  wall: round.wall,
  score: round.score,
  ball: round.ball,
  refilled: round.refilled,
  shrunk: false,
});
