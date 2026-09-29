import {
  bounceOffPaddle,
  bounceOffWalls,
  isLost,
  moveBall,
  touchesTopWall,
  type Ball,
} from './ball';
import { hitBrick } from './brick-hit';
import { fullWall, WALL_POINTS, type Wall } from './bricks';
import type { Paddle } from './paddle';
import { serveDelay, servedBall } from './serve';
import { tuning } from './tuning.config';

/** What is happening on the playfield. */
export type Play =
  | { readonly phase: 'ready' }
  | { readonly phase: 'serving'; readonly framesLeft: number; readonly pressedAt: number }
  | { readonly phase: 'inPlay'; readonly ball: Ball }
  | { readonly phase: 'gameOver' };

/** The part of the game state that changes during play. */
export interface Round {
  readonly play: Play;
  readonly wall: Wall;
  readonly score: number;
  /** Number of the ball in play: 1 to `ballsPerGame`. */
  readonly ball: number;
  /** The paddle is half as wide: the ball touched the top wall since the serve. */
  readonly shrunk: boolean;
  /** The second wall has been given: there is no third. */
  readonly refilled: boolean;
}

/** A new game: full wall, no points, first ball waiting for SERVE. */
export const newRound = (): Round => ({
  play: { phase: 'ready' },
  wall: fullWall(),
  score: 0,
  ball: 1,
  shrunk: false,
  refilled: false,
});

/** After a lost ball: the next one, or the end of the game after the last. */
const loseBall = (round: Round): Round =>
  round.ball < tuning.ballsPerGame
    ? { ...round, play: { phase: 'ready' }, ball: round.ball + 1, shrunk: false }
    : { ...round, play: { phase: 'gameOver' }, shrunk: false };

/**
 * Whether the second wall appears now. The circuit does not count the bricks left: it waits
 * for the first paddle hit once the score reaches the value of a whole wall, and only once.
 */
export const secondWallDue = (round: Round, hitPaddle: boolean): boolean =>
  hitPaddle && !round.refilled && round.score >= WALL_POINTS;

/**
 * One frame of the ball in play: move, bounce, break a brick, or get lost. Touching the top
 * wall halves the paddle; hitting the paddle with a full wall's worth of points brings back
 * the bricks.
 */
const updateBall = (round: Round, ball: Ball, paddle: Paddle): Round => {
  const moved = moveBall(ball);
  const walled = bounceOffWalls(moved);
  const bounced = bounceOffPaddle(walled, paddle);
  const refill = secondWallDue(round, bounced !== walled);
  const hit = hitBrick(bounced, refill ? fullWall() : round.wall);
  const next: Round = {
    ...round,
    wall: hit.wall,
    score: round.score + hit.points,
    shrunk: round.shrunk || touchesTopWall(moved),
    refilled: round.refilled || refill,
  };
  return isLost(hit.ball) ? loseBall(next) : { ...next, play: { phase: 'inPlay', ball: hit.ball } };
};

/**
 * Advances the playfield by one frame. `serve` is the SERVE button; `clock` counts frames and
 * decides, like the timing of the circuit, when and where the served ball appears.
 */
export const updateRound = (round: Round, paddle: Paddle, serve: boolean, clock: number): Round => {
  const { play } = round;
  switch (play.phase) {
    case 'ready':
      return serve
        ? { ...round, play: { phase: 'serving', framesLeft: serveDelay(clock), pressedAt: clock } }
        : round;
    case 'serving':
      return play.framesLeft > 0
        ? { ...round, play: { ...play, framesLeft: play.framesLeft - 1 } }
        : { ...round, play: { phase: 'inPlay', ball: servedBall(play.pressedAt) } };
    case 'inPlay':
      return updateBall(round, play.ball, paddle);
    case 'gameOver':
      // The game decides what comes next: the attract mode (see game.ts).
      return round;
  }
};
