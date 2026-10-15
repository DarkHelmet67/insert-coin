import { newAttract, updateAttract, type Attract } from './attract';
import type { Controls } from './controls';
import { emptyPlayingState, type PlayingState } from './playing';
import { startIntro } from './program';
import { updatePlaying } from './update-playing';

/** The screen being shown and its data. */
export type Screen =
  | { readonly screen: 'attract'; readonly attract: Attract }
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
  attract: newAttract(),
  hiScore,
});

/** A new game, at the "PLAYER 1" screen. */
const newGame = (): PlayingState => startIntro(emptyPlayingState({ step: 'intro' }));

/** The game one frame later. A coin on the attract screen starts a game. */
export const updateGame = (state: GameState, controls: Controls): GameState => {
  switch (state.screen) {
    case 'attract':
      return controls.coin
        ? { screen: 'playing', playing: newGame(), hiScore: state.hiScore }
        : { ...state, attract: updateAttract(state.attract) };
    case 'playing': {
      const playing = updatePlaying(state.playing, controls);
      const hiScore = Math.max(state.hiScore, playing.score);
      return playing.phase.step === 'over' ? createGame(hiScore) : { ...state, playing, hiScore };
    }
  }
};
