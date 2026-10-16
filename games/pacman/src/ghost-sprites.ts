import { NO_FLIP } from '@arcade/tiles';
import type { Ghost } from './ghosts';
import type { HardwareSprite } from './sprites';

/** The palettes of Blinky, Pinky, Inky and Clyde: red, pink, cyan, orange. */
export const GHOST_PALETTES: readonly number[] = [1, 3, 5, 7];

/** The first ghost sprite: 2 per direction, the second with the skirt moved. */
const GHOST_SPRITES = 0x20;

/**
 * A ghost's sprite (interrupt at $155E): its eyes look where it will turn next, and its skirt
 * waves with the animation bit that flips every 8 frames.
 */
export const ghostSprite = (ghost: Ghost, wave: number): HardwareSprite => ({
  code: GHOST_SPRITES + ghost.nextOrientation * 2 + wave,
  palette: GHOST_PALETTES[ghost.id] ?? 1,
  flip: NO_FLIP,
  x: ghost.position.x,
  y: ghost.position.y,
});
