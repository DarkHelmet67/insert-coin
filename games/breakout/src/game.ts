import type { Controls } from './controls';
import { initialPaddle, movePaddle, type Paddle } from './paddle';
import { toggleColorMode, type ColorMode } from './palette';
import { newRound, updateRound, type Round } from './play';

/** Whole game state: the playfield plus the paddle, the colors and a frame counter. */
export interface GameState extends Round {
  readonly colorMode: ColorMode;
  readonly paddle: Paddle;
  /** Frames since the page loaded: the timing that decides when and where a serve appears. */
  readonly clock: number;
}

/** The game as it appears when the page loads: a full wall, first ball waiting, in color. */
export const initialGameState: GameState = {
  ...newRound(),
  colorMode: 'color',
  paddle: initialPaddle,
  clock: 0,
};

/** Returns the game state one frame later, given the player's controls. */
export const updateGame = (state: GameState, controls: Controls): GameState => {
  const paddle = movePaddle(state.paddle, controls);
  return {
    ...state,
    ...updateRound(state, paddle, controls.serve, state.clock),
    paddle,
    clock: state.clock + 1,
    colorMode: controls.colorMode ? toggleColorMode(state.colorMode) : state.colorMode,
  };
};
