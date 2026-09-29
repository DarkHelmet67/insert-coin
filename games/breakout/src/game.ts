import { attractPaddle, updateAttract } from './attract';
import type { Controls } from './controls';
import { initialPaddle, movePaddle, paddleWidth, type Paddle } from './paddle';
import { toggleColorMode, type ColorMode } from './palette';
import { newRound, updateRound, type Round } from './play';
import { noTicks, updateTicks, type Ticks } from './ticks';

/** Whole game state: the playfield plus the paddle, the colors, the record and a frame counter. */
export interface GameState extends Round {
  /** The cabinet is waiting for a player: the ball plays by itself and nothing counts. */
  readonly attract: boolean;
  readonly colorMode: ColorMode;
  readonly paddle: Paddle;
  /** Frames since the page loaded: the timing that decides when and where a serve appears. */
  readonly clock: number;
  /** The best score ever, saved in the browser by `main.ts`. */
  readonly hiScore: number;
  /** The record when this game started: beating it plays the fanfare. */
  readonly recordToBeat: number;
  readonly ticks: Ticks;
}

/**
 * The game as it appears when the page loads: the attract mode, in color, with a full wall.
 * `main.ts` replaces `hiScore` with the record saved in the browser.
 */
export const initialGameState: GameState = {
  ...newRound(),
  attract: true,
  colorMode: 'color',
  paddle: attractPaddle,
  clock: 0,
  hiScore: 0,
  recordToBeat: 0,
  ticks: noTicks,
};

/** A new game, started by SERVE in the attract mode: the ball waits for another SERVE. */
const startGame = (state: GameState): GameState => ({
  ...state,
  ...newRound(),
  attract: false,
  paddle: initialPaddle,
  recordToBeat: state.hiScore,
  ticks: noTicks,
});

/** Back to the attract mode after the last ball, with the last game's score on show. */
const endGame = (state: GameState): GameState => ({
  ...state,
  attract: true,
  play: { phase: 'ready' },
  paddle: attractPaddle,
});

/** One frame of a game: the paddle, the ball, the record and the brick ticks. */
const updatePlaying = (state: GameState, controls: Controls): GameState => {
  const sized = { ...state.paddle, width: paddleWidth(state.shrunk) };
  const paddle = movePaddle(sized, controls);
  const round = updateRound(state, paddle, controls.serve, state.clock);
  const next: GameState = {
    ...state,
    ...round,
    paddle,
    hiScore: Math.max(state.hiScore, round.score),
    ticks: updateTicks(state.ticks, round.score - state.score),
  };
  return round.play.phase === 'gameOver' ? endGame(next) : next;
};

/** One frame of the attract mode, or of a game. */
const updateScreen = (state: GameState, controls: Controls): GameState => {
  if (!state.attract) return updatePlaying(state, controls);
  return controls.serve ? startGame(state) : { ...state, ...updateAttract(state, state.clock) };
};

/** Returns the game state one frame later, given the player's controls. */
export const updateGame = (state: GameState, controls: Controls): GameState => ({
  ...updateScreen(state, controls),
  clock: state.clock + 1,
  colorMode: controls.colorMode ? toggleColorMode(state.colorMode) : state.colorMode,
});
