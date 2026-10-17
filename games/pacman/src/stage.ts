import type { Intermission } from './intermission';
import type { Playing } from './playing';
import type { Timer } from './timers';

/**
 * Where the machine is: the attract mode ($4E00 = 1, its state in $4E02), waiting for the
 * start button ($4E00 = 2) or a game, after the level state of the program ($4E04).
 */
export type Stage =
  /** The ghosts introduced one by one, a step of the sequence and its wait. */
  | { readonly kind: 'intro'; readonly step: number; readonly timer: Timer }
  /** The chase of the attract mode, with the ghosts released so far. */
  | { readonly kind: 'chase'; readonly released: number }
  /** "PUSH START BUTTON": there are credits. */
  | { readonly kind: 'pushStart' }
  /** A game has just started: maze, "PLAYER ONE" and "READY!", no actors yet ($4E03). */
  | { readonly kind: 'starting'; readonly timer: Timer }
  /** The actors in their places under "READY!" ($4E04 = 2 or $0A). */
  | { readonly kind: 'ready'; readonly timer: Timer }
  | { readonly kind: 'playing' }
  /** The death animation is over and the life is gone ($4E04 = 4). */
  | { readonly kind: 'lost' }
  | { readonly kind: 'gameOver'; readonly timer: Timer }
  /** All the dots eaten: everything stands still ($09D8). */
  | { readonly kind: 'cleared'; readonly timer: Timer }
  /** The maze flashes white and blue, 8 times ($09E8-$0A0C). */
  | { readonly kind: 'flashing'; readonly flash: number; readonly timer: Timer }
  /** The playfield empty before the next level ($0A0E). */
  | { readonly kind: 'blank'; readonly timer: Timer }
  /** An intermission between two levels ($0A2C). */
  | { readonly kind: 'intermission'; readonly intermission: Intermission }
  /** The half second after an intermission ($4E04 = $21). */
  | { readonly kind: 'pause'; readonly timer: Timer };

/** The whole machine. */
export interface GameState {
  /** Frames since power-on: the timers count on this clock ($4C84). */
  readonly frame: number;
  /** Coins not yet spent ($4E6E). */
  readonly credits: number;
  readonly stage: Stage;
  readonly playing: Playing;
}
