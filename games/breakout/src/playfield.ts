/**
 * The playfield of the 1976 cabinet, in the units of the original circuit.
 * x counts scan lines across the (rotated) monitor, y counts steps of the horizontal counter
 * along it, starting at the top of the visible picture. See docs/meccaniche-originali.md.
 */

/** Screen size in original units: 228 scan lines across, 208 counter steps top to bottom. */
export const SCREEN_WIDTH = 228;
export const SCREEN_HEIGHT = 208;

/** Width of the two side walls, in scan lines. */
export const SIDE_WALL_WIDTH = 4;

/** Thickness of the top ("back") wall. */
export const TOP_WALL_HEIGHT = 8;

/** Left edge of the right wall: the ball moves between the two walls. */
export const RIGHT_WALL_X = SCREEN_WIDTH - SIDE_WALL_WIDTH;

/** Bricks: 8 rows of 14, each 14 lines wide with a 2-line gap, 4 steps tall. */
export const BRICK_ROWS = 8;
export const BRICK_COLUMNS = 14;
export const BRICK_WIDTH = 14;
export const BRICK_PITCH = 16;
export const BRICK_HEIGHT = 4;

/** Top of the first brick row: the gap above it holds the scores. */
export const BRICKS_TOP = 40;

/** The ball: 4 scan lines wide, 2 steps tall. */
export const BALL_WIDTH = 4;
export const BALL_HEIGHT = 2;

/** The paddle row: 4 steps thick, near the bottom of the picture. */
export const PADDLE_Y = 188;
export const PADDLE_HEIGHT = 4;
