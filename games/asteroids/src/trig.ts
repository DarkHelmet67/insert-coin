/**
 * Sine and cosine as the 6502 program computes them: no floating point, just a table of a
 * quarter turn and its symmetries. Directions are 0-255 for a full turn (0 = right, 64 = up)
 * and results go from -127 to 127.
 */

/** A quarter of a sine wave in 65 steps, 0 to 127 [R $17B9]: round(127 × sin(i × 90° / 64)). */
export const SINE_TABLE: readonly number[] = [
  0x00, 0x03, 0x06, 0x09, 0x0c, 0x10, 0x13, 0x16, 0x19, 0x1c, 0x1f, 0x22, 0x25, 0x28, 0x2b, 0x2e,
  0x31, 0x33, 0x36, 0x39, 0x3c, 0x3f, 0x41, 0x44, 0x47, 0x49, 0x4c, 0x4e, 0x51, 0x53, 0x55, 0x58,
  0x5a, 0x5c, 0x5e, 0x60, 0x62, 0x64, 0x66, 0x68, 0x6a, 0x6b, 0x6d, 0x6f, 0x70, 0x71, 0x73, 0x74,
  0x75, 0x76, 0x78, 0x79, 0x7a, 0x7a, 0x7b, 0x7c, 0x7d, 0x7d, 0x7e, 0x7e, 0x7e, 0x7f, 0x7f, 0x7f,
  0x7f,
];

/**
 * Sine of a direction [P $77D5]: the first quarter comes from the table, the second is the first
 * read backwards, the second half is the first half negated.
 */
export const sine = (direction: number): number => {
  const dir = direction & 0xff;
  const half = dir & 0x7f;
  const value = SINE_TABLE[half <= 64 ? half : 128 - half] ?? 0;
  // `0 - value` rather than `-value`: in JavaScript -0 is a separate number, and the program
  // has no such thing.
  return dir >= 128 ? 0 - value : value;
};

/** Cosine of a direction: the sine a quarter turn later [P $77D2]. */
export const cosine = (direction: number): number => sine(direction + 64);
