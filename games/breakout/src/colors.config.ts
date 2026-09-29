/**
 * Screen colors, in one place so they are easy to change.
 *
 * The original monitor was black and white: the colors came from strips of colored film on the
 * glass, each covering a band of the screen. Whatever passes under a strip (bricks, walls, the
 * ball) takes its color. The game can show either look, switching with the V key.
 *
 * Any CSS color works. The default values come from the MAME artwork of the cabinet.
 */
export const colorConfig = {
  /** Screen background. */
  background: '#000',
  /** The single color of the monochrome monitor: everything outside the strips. */
  mono: '#fff',
  /** The four brick strips from the top, each over two rows: red, orange, green, yellow. */
  brickStrips: ['#f00032', '#ffa000', '#4bc300', '#fff500'],
  /** The strip over the paddle area. */
  paddleStrip: '#0078c8',
} as const;
