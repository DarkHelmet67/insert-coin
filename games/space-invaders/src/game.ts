import { initialAttractState, updateAttract, type AttractState } from './attract';
import type { Controls } from './controls';
import { initialPlayingState, isGameOver, updatePlaying, type PlayingState } from './playing';

/** The screen being shown and the data of that screen. */
export type Screen =
  | { readonly screen: 'attract'; readonly attract: AttractState }
  | { readonly screen: 'playing'; readonly playing: PlayingState }
  | { readonly screen: 'gameOver'; readonly playing: PlayingState; readonly framesLeft: number };

/** Whole game state: the current screen plus the best score, which survives between games. */
export type GameState = Screen & { readonly hiScore: number };

/** Frames the "GAME OVER" message stays on screen before the attract screen returns. */
export const GAME_OVER_FRAMES = 300;

/** The game as it appears when the page loads: waiting for a coin. */
export const initialGameState: GameState = {
  screen: 'attract',
  attract: initialAttractState,
  hiScore: 0,
};

/** A new game, keeping the best score. */
const startGame = (hiScore: number): GameState => ({
  screen: 'playing',
  playing: initialPlayingState(),
  hiScore,
});

/** One frame of play: the game ends when `isGameOver` says so, updating the best score. */
const updatePlayingScreen = (
  playing: PlayingState,
  controls: Controls,
  hiScore: number,
): GameState => {
  const next = updatePlaying(playing, controls);
  const best = Math.max(hiScore, next.score);
  return isGameOver(next)
    ? { screen: 'gameOver', playing: next, framesLeft: GAME_OVER_FRAMES, hiScore: best }
    : { screen: 'playing', playing: next, hiScore: best };
};

/**
 * Returns the game state one step later, given the player's controls.
 * `dt` only drives the attract screen: the game itself advances in whole 60 Hz frames.
 */
export const updateGame = (state: GameState, controls: Controls, dt: number): GameState => {
  if (controls.coin && state.screen !== 'playing') return startGame(state.hiScore);
  switch (state.screen) {
    case 'attract':
      return { ...state, attract: updateAttract(state.attract, dt) };
    case 'playing':
      return updatePlayingScreen(state.playing, controls, state.hiScore);
    case 'gameOver':
      return state.framesLeft > 1
        ? { ...state, framesLeft: state.framesLeft - 1 }
        : { screen: 'attract', attract: initialAttractState, hiScore: state.hiScore };
  }
};
