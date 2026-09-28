import { ufoSprite } from './sprites';

/** The mystery ship while it crosses the screen. */
export interface Saucer {
  readonly x: number;
  readonly direction: 1 | -1;
  /** Frames since it appeared: drives its warbling sound. */
  readonly age: number;
}

/** The mystery ship: the countdown to its next visit, and the ship itself when on screen. */
export interface UfoState {
  readonly countdown: number;
  readonly saucer: Saucer | undefined;
}

/** Height of the mystery ship's lane, just below the score. */
export const UFO_Y = 40;

/** Frames between two visits: 0x600 = 1536 frames, 25.6 seconds, as in the original. */
export const UFO_INTERVAL = 0x600;

/** The ship only visits while at least this many invaders are left. */
export const UFO_MIN_ALIENS = 8;

/** Horizontal speed, in pixels per frame. */
export const UFO_SPEED = 1;

/** Horizontal limits of the ship's path. */
export const UFO_LEFT_X = 8;
export const UFO_RIGHT_X = 224 - 8 - ufoSprite.width;

/**
 * Points for hitting the ship, chosen by the number of shots the player has fired.
 * The original steps through this table with every shot, and a bug makes it wrap after 15
 * entries, so the 300 comes back every 15 shots (8, 23, 38...). The ship first shows up after
 * 25 seconds, when shot 8 is long gone: that is why players know the trick as "the 23rd shot".
 */
export const UFO_SCORES: readonly number[] = [
  100, 50, 50, 100, 150, 100, 100, 50, 300, 100, 100, 100, 50, 150, 100,
];

/** The first visit comes after a full interval. */
export const initialUfoState: UfoState = { countdown: UFO_INTERVAL, saucer: undefined };

/** Points for hitting the ship with the `shotsFired`-th shot. */
export const ufoScore = (shotsFired: number): number =>
  UFO_SCORES[shotsFired % UFO_SCORES.length] ?? 100;

/** A new ship: the parity of the shot count decides which side it enters from. */
export const launchSaucer = (shotsFired: number): Saucer =>
  shotsFired % 2 === 0
    ? { x: UFO_LEFT_X, direction: 1, age: 0 }
    : { x: UFO_RIGHT_X, direction: -1, age: 0 };

/** Moves a flying ship; returns `undefined` once it has left the screen. */
const moveSaucer = (saucer: Saucer): Saucer | undefined => {
  const x = saucer.x + saucer.direction * UFO_SPEED;
  return x < UFO_LEFT_X || x > UFO_RIGHT_X ? undefined : { ...saucer, x, age: saucer.age + 1 };
};

/** Advances the mystery ship by one frame: fly, or count down to the next visit. */
export const stepUfo = (state: UfoState, aliensLeft: number, shotsFired: number): UfoState => {
  if (state.saucer) return { ...state, saucer: moveSaucer(state.saucer) };
  if (state.countdown > 0) return { ...state, countdown: state.countdown - 1 };
  return aliensLeft >= UFO_MIN_ALIENS
    ? { countdown: UFO_INTERVAL, saucer: launchSaucer(shotsFired) }
    : { ...state, countdown: UFO_INTERVAL };
};
