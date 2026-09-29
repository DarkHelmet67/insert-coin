import { bounceOffPaddle, bounceOffWalls, isLost, moveBall, type Ball } from './ball';
import { hitBrick } from './brick-hit';
import { fullWall, type Wall } from './bricks';
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
}

/** A new game: full wall, no points, first ball waiting for SERVE. */
export const newRound = (): Round => ({
  play: { phase: 'ready' },
  wall: fullWall(),
  score: 0,
  ball: 1,
});

/** After a lost ball: the next one, or the end of the game after the last. */
const loseBall = (round: Round): Round =>
  round.ball < tuning.ballsPerGame
    ? { ...round, play: { phase: 'ready' }, ball: round.ball + 1 }
    : { ...round, play: { phase: 'gameOver' } };

/** One frame of the ball in play: move, bounce, break a brick, or get lost. */
const updateBall = (round: Round, ball: Ball, paddle: Paddle): Round => {
  const bounced = bounceOffPaddle(bounceOffWalls(moveBall(ball)), paddle);
  const hit = hitBrick(bounced, round.wall);
  const next = { ...round, wall: hit.wall, score: round.score + hit.points };
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
      return serve ? newRound() : round;
  }
};
