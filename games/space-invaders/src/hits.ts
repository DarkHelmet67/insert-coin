import { bitmapsOverlap } from '@arcade/collision';
import type { Alien } from './aliens';
import type { ShotState } from './shot';
import { alienSprites, shotSprite } from './sprites';

/**
 * The invader hit by the shot, if any. Pixel-perfect: the shot must touch a lit pixel of the
 * invader, so a shot passing between the legs of an octopus misses, as in the original.
 */
export const findHitAlien = (shot: ShotState, aliens: readonly Alien[]): Alien | undefined =>
  aliens.find((alien) =>
    bitmapsOverlap(
      { bitmap: shotSprite, x: shot.x, y: shot.y },
      { bitmap: alienSprites[alien.kind][0], x: alien.x, y: alien.y },
    ),
  );
