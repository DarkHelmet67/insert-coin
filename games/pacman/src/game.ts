import type { Controls } from './controls';
import { newPlaying, updatePlaying, type Playing } from './playing';

/** The whole game: for now always playing; attract mode and game over come later. */
export interface GameState {
  readonly playing: Playing;
}

/** The game at power-on, with the record saved by the browser. */
export const createGame = (hiScore: number): GameState => ({ playing: newPlaying(hiScore) });

/** One frame of the game. */
export const updateGame = (state: GameState, controls: Controls): GameState => ({
  playing: updatePlaying(state.playing, controls.joystick),
});
