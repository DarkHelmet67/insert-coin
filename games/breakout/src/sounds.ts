import type { Ball } from './ball';
import type { GameState } from './game';
import {
  BALL_HEIGHT,
  BALL_WIDTH,
  PADDLE_Y,
  RIGHT_WALL_X,
  SIDE_WALL_WIDTH,
  TOP_WALL_HEIGHT,
} from './playfield';
import type { SoundName } from './sound-bank';
import { tuning } from './tuning.config';

export { sounds, type SoundName } from './sound-bank';

/** The ball of a state, if one is in play. */
const ballOf = (state: GameState): Ball | undefined =>
  state.play.phase === 'inPlay' ? state.play.ball : undefined;

/** The ball turned back up on the paddle row. */
const hitPaddle = (prev: Ball, next: Ball): boolean =>
  prev.dirY === 1 && next.dirY === -1 && next.y === PADDLE_Y - BALL_HEIGHT;

/** The ball turned sideways against a side wall. */
const hitSideWall = (prev: Ball, next: Ball): boolean =>
  prev.dirX !== next.dirX && (next.x === SIDE_WALL_WIDTH || next.x === RIGHT_WALL_X - BALL_WIDTH);

/** The ball turned down against the top wall. */
const hitTopWall = (prev: Ball, next: Ball): boolean =>
  tuning.sounds.topWall && prev.dirY === -1 && next.dirY === 1 && next.y === TOP_WALL_HEIGHT;

/** The sounds of the ball in this frame: paddle, or wall. */
const ballSounds = (prev: Ball, next: Ball): readonly SoundName[] => {
  if (hitPaddle(prev, next)) return ['paddle'];
  return hitSideWall(prev, next) || hitTopWall(prev, next) ? ['wall'] : [];
};

/**
 * Whether this frame beat the record held when the game started. Only once per game, and only
 * if there was a record: the first brick of the first game ever is not a celebration.
 */
const beatRecord = (previous: GameState, next: GameState): boolean =>
  previous.recordToBeat > 0 &&
  previous.score <= previous.recordToBeat &&
  next.score > previous.recordToBeat;

/**
 * The sounds to play for the frame that turned `previous` into `next`. Sounds are derived by
 * comparing two states, so the game logic stays pure and unaware of audio. The attract mode is
 * silent, as on the cabinet.
 */
export const soundsFor = (previous: GameState, next: GameState): readonly SoundName[] => {
  if (previous.attract || next.attract) return [];
  const prev = ballOf(previous);
  const current = ballOf(next);
  return [
    ...(prev && current ? ballSounds(prev, current) : []),
    ...(next.ticks.played > previous.ticks.played ? (['brick'] as const) : []),
    ...(beatRecord(previous, next) ? (['newRecord'] as const) : []),
  ];
};
