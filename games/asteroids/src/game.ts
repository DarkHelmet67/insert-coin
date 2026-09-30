import type { Controls } from './controls';
import { newShip, updateShip, type Ship } from './ship';

/** Everything that changes during a game. For now, the ship alone in space. */
export interface GameState {
  /**
   * Frame counter, 0-255 like the program's fast timer [P $5C]: many rules happen "every
   * second frame" or "4 frames on, 4 off" and read its bits.
   */
  readonly frame: number;
  readonly ship: Ship;
}

/** The state when the page opens. */
export const initialGameState: GameState = { frame: 0, ship: newShip };

/** One frame of the game: a pure function from the state and the controls to the next state. */
export const updateGame = (state: GameState, controls: Controls): GameState => ({
  frame: (state.frame + 1) & 0xff,
  ship: updateShip(state.ship, controls, state.frame),
});
