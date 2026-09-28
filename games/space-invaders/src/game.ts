import { initialAttractState, updateAttract, type AttractState } from './attract';
import type { Controls } from './controls';
import { toggleColorMode, type ColorMode } from './palette';
import { initialPlayingState, isGameOver, updatePlaying, type PlayingState } from './playing';

/** The screen being shown and the data of that screen. */
export type Screen =
  | { readonly screen: 'attract'; readonly attract: AttractState }
  | { readonly screen: 'playing'; readonly playing: PlayingState }
  | { readonly screen: 'gameOver'; readonly playing: PlayingState; readonly framesLeft: number };

/** What survives from one game to the next: the best score and the chosen colors. */
export interface Session {
  readonly hiScore: number;
  readonly colorMode: ColorMode;
}

/** Whole game state: the current screen plus the session data. */
export type GameState = Screen & Session;

/** A screen together with the best score, which changes during play. */
type ScoreScreen = Screen & Pick<Session, 'hiScore'>;

/** Frames the "GAME OVER" message stays on screen before the attract screen returns. */
export const GAME_OVER_FRAMES = 300;

/** The game as it appears when the page loads: waiting for a coin, in color. */
export const initialGameState: GameState = {
  screen: 'attract',
  attract: initialAttractState,
  hiScore: 0,
  colorMode: 'color',
};

/** A new game, keeping the best score. */
const startGame = (hiScore: number): ScoreScreen => ({
  screen: 'playing',
  playing: initialPlayingState(),
  hiScore,
});

/** One frame of play: the game ends when `isGameOver` says so, updating the best score. */
const updatePlayingScreen = (
  playing: PlayingState,
  controls: Controls,
  hiScore: number,
): ScoreScreen => {
  const next = updatePlaying(playing, controls);
  const best = Math.max(hiScore, next.score);
  return isGameOver(next)
    ? { screen: 'gameOver', playing: next, framesLeft: GAME_OVER_FRAMES, hiScore: best }
    : { screen: 'playing', playing: next, hiScore: best };
};

/** Advances the current screen: attract, play or game over. */
const updateScreen = (state: GameState, controls: Controls, dt: number): ScoreScreen => {
  if (controls.coin && state.screen !== 'playing') return startGame(state.hiScore);
  switch (state.screen) {
    case 'attract':
      return {
        screen: 'attract',
        attract: updateAttract(state.attract, dt),
        hiScore: state.hiScore,
      };
    case 'playing':
      return updatePlayingScreen(state.playing, controls, state.hiScore);
    case 'gameOver':
      return state.framesLeft > 1
        ? { ...state, framesLeft: state.framesLeft - 1 }
        : { screen: 'attract', attract: initialAttractState, hiScore: state.hiScore };
  }
};

/**
 * Returns the game state one step later, given the player's controls.
 * `dt` only drives the attract screen: the game itself advances in whole 60 Hz frames.
 * The color mode can be switched on any screen, without affecting the game.
 */
export const updateGame = (state: GameState, controls: Controls, dt: number): GameState => ({
  ...updateScreen(state, controls, dt),
  colorMode: controls.colorMode ? toggleColorMode(state.colorMode) : state.colorMode,
});
