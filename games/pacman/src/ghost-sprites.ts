import { NO_FLIP } from '@arcade/tiles';
import type { Ghost } from './ghosts';
import type { HardwareSprite } from './sprites';

/** The first ghost sprite: 2 per direction, the second with the skirt moved. */
const GHOST_SPRITES = 0x20;
/** The blue ghost, in two waves. */
const BLUE_SPRITES = 0x1c;

/**
 * A ghost's sprite (interrupt at $154B): blue and wavy after an energizer; otherwise, and for
 * the eyes, looking where it will turn next, with the skirt waving every 8 frames. The color
 * is the ghost's own palette register.
 */
export const ghostSprite = (ghost: Ghost, wave: number): HardwareSprite => ({
  code:
    ghost.blue && ghost.eyes === 'alive'
      ? BLUE_SPRITES + wave
      : GHOST_SPRITES + ghost.nextOrientation * 2 + wave,
  palette: ghost.palette,
  flip: NO_FLIP,
  x: ghost.position.x,
  y: ghost.position.y,
});

/** The points of the `count`-th ghost eaten, in place of the ghost: 200 to 1600 ($1250). */
export const ghostPointsSprite = (ghost: Ghost, count: number): HardwareSprite => ({
  code: 0x27 + count,
  palette: 0x18,
  flip: NO_FLIP,
  x: ghost.position.x,
  y: ghost.position.y,
});
