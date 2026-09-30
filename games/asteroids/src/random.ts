/**
 * The random number generator of the 6502 program [P $77B5]: a 16-bit shift register, stepped
 * once per frame and once more for every random choice. Pure: each call returns the number and
 * the next state of the generator, which the game keeps in its state.
 */

/** The two bytes of the generator. */
export interface Rng {
  readonly lo: number;
  readonly hi: number;
}

/** A number drawn from the generator, 0-255, and the generator after drawing it. */
export interface Draw {
  readonly value: number;
  readonly rng: Rng;
}

/**
 * Steps the generator: both bytes shift left as one 16-bit number, the top bit feeds back into
 * the bottom, bit 1 flips bit 0, and an all-zero state is nudged away from zero.
 */
export const nextRandom = (rng: Rng): Draw => {
  const shiftedLo = (rng.lo << 1) & 0xff;
  const hi = ((rng.hi << 1) | (rng.lo >> 7)) & 0xff;
  const fedBack = hi & 0x80 ? (shiftedLo + 1) & 0xff : shiftedLo;
  const flipped = fedBack & 0x02 ? fedBack ^ 0x01 : fedBack;
  const lo = (flipped | hi) === 0 ? flipped + 1 : flipped;
  return { value: lo, rng: { lo, hi } };
};

/** Steps the generator `count` times and keeps only the last number, as the program often does. */
export const nextRandomAfter = (rng: Rng, count: number): Draw =>
  Array.from({ length: count - 1 }).reduce<Draw>((draw) => nextRandom(draw.rng), nextRandom(rng));

/**
 * A small random speed change from a random byte [P $7206]: the byte masked to its sign and low
 * four bits, giving -16..-1 or 0..15.
 */
export const smallSigned = (value: number): number => {
  const masked = value & 0x8f;
  return masked & 0x80 ? (masked | 0xf0) - 256 : masked;
};

/** A generator started from any number, e.g. the time when the page opens. */
export const seedRandom = (seed: number): Rng => ({ lo: seed & 0xff, hi: (seed >> 8) & 0xff });
