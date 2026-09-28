import { CANNON_WIDTH, CANNON_Y, type CannonState } from './cannon';
import { shotSprite } from './sprites';

/** The cannon's laser shot while it flies up the screen. Only one can exist at a time, as in the original. */
export interface ShotState {
  readonly x: number;
  readonly y: number;
}

/**
 * Upward speed in pixels per second: 4 pixels per step at 60 steps per second.
 * A step of 4 pixels is shorter than any invader (8 pixels tall), so the shot cannot jump over one.
 */
export const SHOT_SPEED = 240;

/** The shot disappears when it reaches this height, just below the score. */
export const SHOT_TOP_LIMIT = 32;

/** A new shot leaving the tip of the cannon. */
export const fireShot = (cannon: CannonState): ShotState => ({
  x: Math.round(cannon.x) + Math.floor(CANNON_WIDTH / 2),
  y: CANNON_Y - shotSprite.height,
});

/** Moves the shot up for `dt` seconds; returns `undefined` once it has left the playfield. */
export const moveShot = (shot: ShotState, dt: number): ShotState | undefined => {
  const y = shot.y - SHOT_SPEED * dt;
  return y < SHOT_TOP_LIMIT ? undefined : { x: shot.x, y };
};
