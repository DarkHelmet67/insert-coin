/**
 * Screen colors, in one place so they are easy to change.
 *
 * The original monitor was black and white: the colors came from strips of colored film glued
 * on the cabinet's glass. The game can show either look, switching with the V key:
 * - `mono`: everything in the monitor's white;
 * - `color`: the colors below.
 *
 * Any CSS color works: '#30ff30', 'lime', 'rgb(48 255 48)'.
 */
export const colorConfig = {
  /** Screen background. */
  background: '#000',
  /** The single color of the monochrome monitor. */
  mono: '#fff',
  /** Score, messages and the attract screen text. */
  text: '#fff',
  /** Cannon, shields, ground line and reserve cannons. */
  cannon: '#30ff30',
  /** Mystery ship, its points and the "GAME OVER" message. */
  ufo: '#ff3030',
  /** The cannon's shot and the invaders' bombs. */
  shots: '#fff',
  /** Invaders, one color per row from top to bottom. */
  alienRows: ['#40c8ff', '#30ff30', '#30ff30', '#c050ff', '#c050ff'],
} as const;
