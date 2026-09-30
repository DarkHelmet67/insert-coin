/**
 * The screen of the 1979 cabinet, in the units of its Digital Vector Generator (DVG).
 * The DVG steers the beam on a 1024 x 1024 grid; the monitor shows a 4:3 window of it,
 * 1024 wide and 768 tall. See docs/meccaniche-originali.md.
 */

/** Visible screen size in DVG units. */
export const SCREEN_WIDTH = 1024;
export const SCREEN_HEIGHT = 768;

/**
 * DVG y of the bottom edge of the visible screen. In the DVG y grows upwards, the opposite of
 * the canvas: see `toCanvasY`.
 */
export const SCREEN_BOTTOM = 128;

/** Converts a DVG y (upwards, 128 at the bottom edge) to a canvas y (downwards, 0 at the top). */
export const toCanvasY = (dvgY: number): number => SCREEN_BOTTOM + SCREEN_HEIGHT - dvgY;
