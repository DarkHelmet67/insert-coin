import { fullWall, type Wall } from './bricks';
import type { Controls } from './controls';
import { toggleColorMode, type ColorMode } from './palette';

/** Whole game state. It grows step by step as the remake is built. */
export interface GameState {
  readonly colorMode: ColorMode;
  readonly wall: Wall;
  readonly score: number;
  /** Number of the ball in play, shown at the top right: 1 to 3. */
  readonly ball: number;
}

/** The game as it appears when the page loads: a full wall, in color. */
export const initialGameState: GameState = {
  colorMode: 'color',
  wall: fullWall(),
  score: 0,
  ball: 1,
};

/** Returns the game state one frame later, given the player's controls. */
export const updateGame = (state: GameState, controls: Controls): GameState => ({
  ...state,
  colorMode: controls.colorMode ? toggleColorMode(state.colorMode) : state.colorMode,
});
