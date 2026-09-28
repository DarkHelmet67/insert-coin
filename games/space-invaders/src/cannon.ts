import { clamp } from '@arcade/math';

/** The player's laser cannon. Only the horizontal position changes. */
export interface CannonState {
  /** Left edge, in screen pixels. */
  readonly x: number;
}

/** Cannon width in pixels, as in the original sprite. */
export const CANNON_WIDTH = 13;

/** The original cannon moves one pixel per frame at 60 Hz. */
export const CANNON_SPEED = 60;

/** Leftmost and rightmost positions reachable by the cannon. */
export const CANNON_MIN_X = 16;
export const CANNON_MAX_X = 224 - 16 - CANNON_WIDTH;

/** Vertical position of the cannon's top edge, in screen pixels. */
export const CANNON_Y = 216;

/** Frames the game pauses while the cannon explodes (not documented in the sources: chosen by eye). */
export const CANNON_EXPLOSION_FRAMES = 90;

/** The cannon at the start of a game: left side of the screen, like the original. */
export const initialCannonState: CannonState = { x: CANNON_MIN_X };

/** Moves the cannon `direction` for `dt` seconds, stopping at the screen edges. */
export const moveCannon = (
  cannon: CannonState,
  direction: -1 | 0 | 1,
  dt: number,
): CannonState => ({
  x: clamp(cannon.x + direction * CANNON_SPEED * dt, CANNON_MIN_X, CANNON_MAX_X),
});
