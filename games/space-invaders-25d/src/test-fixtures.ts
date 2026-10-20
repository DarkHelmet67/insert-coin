import { CANNON_MAX_X, CANNON_MIN_X } from '@arcade/space-invaders/src/cannon';
import { initialGameState, type GameState } from '@arcade/space-invaders/src/game';
import { initialPlayingState, type PlayingState } from '@arcade/space-invaders/src/playing';

/** A game in progress, with the playing data changed by `changes`. */
export const playingGame = (changes: Partial<PlayingState> = {}): GameState => ({
  screen: 'playing',
  playing: { ...initialPlayingState(1), ...changes },
  recordToBeat: 0,
  hiScore: 0,
  colorMode: 'color',
});

/** The attract screen, waiting for a coin. */
export const attractGame: GameState = initialGameState;

/** The cannon at the left and right ends of its run. */
export const LEFTMOST = CANNON_MIN_X;
export const RIGHTMOST = CANNON_MAX_X;
