import type { Viewport } from '@arcade/vector';

/**
 * The screen of the 1979 cabinet, in the units of its Digital Vector Generator (DVG).
 * The DVG steers the beam on a 1024 x 1024 grid with y upwards; the monitor shows a 4:3 window
 * of it, 1024 wide and 768 tall, from y = 128 to 895. See docs/meccaniche-originali.md.
 */
export const SCREEN_WIDTH = 1024;
export const SCREEN_HEIGHT = 768;

/** DVG y of the bottom edge of the visible screen. */
export const SCREEN_BOTTOM = 128;

/**
 * What the monitor shows, for `@arcade/vector`: the 1024 x 768 playfield plus a thin margin all
 * around, 1044 x 788 units centered on it, as in MAME [H]. The program draws the top of the score
 * at y = 900, a few units above the playfield, and the margin keeps it on screen.
 */
export const VIEWPORT: Viewport = {
  left: -10,
  bottom: SCREEN_BOTTOM - 10,
  width: SCREEN_WIDTH + 20,
  height: SCREEN_HEIGHT + 20,
};
