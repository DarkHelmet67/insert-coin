import type { Controls } from './controls';
import { emptyPlayingState, type PlayingState, type StarField } from './playing';
import { startIntro } from './program';
import { updatePlaying } from './update-playing';
import { advanceStars, STARS_SLOW } from './stars';

/** The screen being shown and its data. */
export type Screen =
  | { readonly screen: 'attract'; readonly frame: number; readonly stars: StarField }
  | { readonly screen: 'playing'; readonly playing: PlayingState };

/** What survives from one game to the next. */
export interface Session {
  readonly hiScore: number;
}

/** The whole game state. */
export type GameState = Screen & Session;

/** The cabinet waiting for a coin, with `hiScore` as the record to beat. */
export const createGame = (hiScore: number): GameState => ({
  screen: 'attract',
  frame: 0,
  stars: { phase: 0, speed: STARS_SLOW },
  hiScore,
});

/** A new game, at the "PLAYER 1" screen. */
const newGame = (): PlayingState => startIntro(emptyPlayingState({ step: 'intro' }));

/** One frame of the attract screen: the stars keep moving. */
const updateAttract = (state: Extract<GameState, { screen: 'attract' }>): GameState => ({
  ...state,
  frame: state.frame + 1,
  stars: { ...state.stars, phase: advanceStars(state.stars.phase, state.stars.speed) },
});

/** The game one frame later. A coin on the attract screen starts a game. */
export const updateGame = (state: GameState, controls: Controls): GameState => {
  switch (state.screen) {
    case 'attract':
      return controls.coin
        ? { screen: 'playing', playing: newGame(), hiScore: state.hiScore }
        : updateAttract(state);
    case 'playing': {
      const playing = updatePlaying(state.playing, controls);
      const hiScore = Math.max(state.hiScore, playing.score);
      return playing.phase.step === 'over' ? createGame(hiScore) : { ...state, playing, hiScore };
    }
  }
};
