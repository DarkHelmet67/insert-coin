import type { Alien } from './aliens';
import { alienSprites, explosionSprite } from './sprites';

/** An explosion left on screen where an invader was hit. */
export interface Explosion {
  readonly x: number;
  readonly y: number;
  /** Seconds before it disappears. */
  readonly timeLeft: number;
}

/** How long an explosion stays on screen, in seconds. */
export const EXPLOSION_DURATION = 0.25;

/** An explosion centered on the invader that was hit. */
export const explodeAlien = (alien: Alien): Explosion => ({
  x: alien.x + Math.floor((alienSprites[alien.kind][0].width - explosionSprite.width) / 2),
  y: alien.y,
  timeLeft: EXPLOSION_DURATION,
});

/** Ages the explosions by `dt` seconds and removes the ones that have finished. */
export const updateExplosions = (
  explosions: readonly Explosion[],
  dt: number,
): readonly Explosion[] =>
  explosions
    .map((explosion) => ({ ...explosion, timeLeft: explosion.timeLeft - dt }))
    .filter((explosion) => explosion.timeLeft > 0);
