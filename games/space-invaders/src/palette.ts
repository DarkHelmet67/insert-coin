/**
 * Screen colors. The original monitor was black and white: color came from strips of
 * cellophane glued on the screen, red at the top (UFO) and green at the bottom (cannon).
 */
export const colors = {
  background: '#000',
  text: '#fff',
  aliens: '#fff',
  ufo: '#ff3030',
  cannon: '#30ff30',
} as const;

/** Vertical extent of the red strip, around the mystery ship's lane. */
export const RED_STRIP_TOP = 32;
export const RED_STRIP_BOTTOM = 56;

/** Top of the green strip, covering shields, cannon and reserve cannons. */
export const GREEN_STRIP_TOP = 184;

/**
 * The color an object gets when its top edge is at `y`: like on the cabinet, anything passing
 * behind a strip takes its color, so invaders that come down low turn green.
 */
export const colorAt = (y: number): string => {
  if (y >= GREEN_STRIP_TOP) return colors.cannon;
  if (y >= RED_STRIP_TOP && y < RED_STRIP_BOTTOM) return colors.ufo;
  return colors.aliens;
};
