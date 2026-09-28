import { initialAttractState, updateAttract, type AttractState } from './attract';
import type { Controls } from './controls';
import { initialPlayingState, updatePlaying, type PlayingState } from './playing';

/** Whole game state: which screen is shown and the data of that screen. */
export type GameState =
  | { readonly screen: 'attract'; readonly attract: AttractState }
  | { readonly screen: 'playing'; readonly playing: PlayingState };

/** The game as it appears when the page loads: waiting for a coin. */
export const initialGameState: GameState = { screen: 'attract', attract: initialAttractState };

/** Returns the game state `dt` seconds later, given the player's controls. */
export const updateGame = (state: GameState, controls: Controls, dt: number): GameState => {
  switch (state.screen) {
    case 'attract':
      return controls.coin
        ? { screen: 'playing', playing: initialPlayingState() }
        : { screen: 'attract', attract: updateAttract(state.attract, dt) };
    case 'playing':
      return { screen: 'playing', playing: updatePlaying(state.playing, controls, dt) };
  }
};
