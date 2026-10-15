/*
 * The arithmetic routines of the second processor, ported bit for bit. Flight paths depend on
 * their rounding, so the remake does not replace them with floating point.
 */

/**
 * `c_0EAA`: 16-bit by 8-bit division, the Z80 way (shift and subtract, 17 rounds).
 * Returns the 16-bit quotient; dividing by 0 gives $FFFF, as on the hardware.
 */
export const divide = (dividend: number, divisor: number): number => {
  let a = 0;
  let hl = dividend & 0xffff;
  let carry = 0;
  for (let round = 0; round < 17; round += 1) {
    a = a * 2 + carry;
    if (a > 0xff) {
      a = (a - divisor) & 0xff;
      carry = 1;
    } else if (a >= divisor) {
      a -= divisor;
      carry = 1;
    } else {
      carry = 0;
    }
    hl = hl * 2 + carry;
    carry = hl > 0xffff ? 1 : 0;
    hl &= 0xffff;
  }
  return hl;
};

/** `c_0E97`: 8-bit by 8-bit multiplication. */
export const multiply = (a: number, b: number): number => (a & 0xff) * (b & 0xff);

/** A byte read as a signed number (-128 to 127). */
export const signed8 = (byte: number): number => ((byte & 0xff) ^ 0x80) - 0x80;

/**
 * `c_0E5B`: the direction from (`fromY`, `fromX`) to (`toY`, `toX`), all in units of 2 pixels
 * (bits 8-1 of the 9.7 fixed point coordinates), as a 10-bit angle (0 right, $100 up).
 * The octant comes from the signs and from which difference is larger; inside the octant, the
 * ratio of the smaller difference to the larger is a good enough arctangent.
 */
export const angleTo = (toY: number, toX: number, fromY: number, fromX: number): number => {
  const dx = (toX - fromX) & 0xff;
  const xNegative = toX < fromX;
  const absX = xNegative ? (0x100 - dx) & 0xff : dx;
  const dy = (toY - fromY) & 0xff;
  const yNegative = toY < fromY;
  const absY = yNegative ? (0x100 - dy) & 0xff : dy;
  const quadrant = yNegative ? ((xNegative ? 1 : 0) ^ 1) | 2 : xNegative ? 1 : 0;
  // The "cp c" compares |dy| with |dx|; together with the quadrant it picks the half octant.
  const yBelowX = absY < absX ? 1 : 0;
  const octant = ((quadrant << 1) | ((yBelowX ^ quadrant) & 1 ? 0 : 1)) & 0xff;
  const small = yBelowX ? absY : absX;
  const large = yBelowX ? absX : absY;
  const ratio = divide(small << 8, large);
  const high = ratio >> 8;
  const low = ((high ^ octant) & 1) === 1 ? ~ratio & 0xff : ratio & 0xff;
  return (((octant << 8) | low) >> 1) & 0x3ff;
};
