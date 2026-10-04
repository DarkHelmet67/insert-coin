import type { Viewport } from '@arcade/vector';

/**
 * The screen of the 1979 cabinet, in the units of its Digital Vector Generator (DVG): x from 0 to
 * 1023, y upwards. See docs/meccaniche-originali.md, section 1.
 */
export const SCREEN_WIDTH = 1024;

/**
 * What the monitor shows, for `@arcade/vector`: 1044 x 800 units as in MAME [H], from x = -10
 * and y = -6, the same mapping as Asteroids. The text at the top of the screen starts at y = 748
 * and the lowest landing sites lie at y = 24, so both fit with a small margin.
 */
export const VIEWPORT: Viewport = {
  left: -10,
  bottom: -6,
  width: 1044,
  height: 800,
};
