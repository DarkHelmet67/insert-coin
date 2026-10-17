/**
 * How fast an actor moves, as the program stores it: 32 bits that turn one place to the left
 * at each update; the actor moves one pixel when the bit leaving on the left is 1. With 16 bits
 * set out of 32 it moves every other update. The ROM spreads the bits so that the steps come as
 * evenly as possible.
 */
export type SpeedPattern = number;

/** The pattern of four ROM bytes: the program keeps them as two words, high word first. */
export const patternFromBytes = (bytes: readonly number[], at: number): SpeedPattern => {
  /** The byte `offset` places after `at`. */
  const byte = (offset: number): number => bytes[at + offset] ?? 0;
  return ((byte(1) << 24) | (byte(0) << 16) | (byte(3) << 8) | byte(2)) >>> 0;
};

/** The result of one turn of a pattern. */
export interface SpeedTick {
  readonly pattern: SpeedPattern;
  /** Whether the actor moves one pixel in this update. */
  readonly move: boolean;
}

/** Turns the pattern one bit to the left (`ADD HL,HL` / `ADC HL,HL` / `INC (HL)` at $1818). */
export const tickSpeed = (pattern: SpeedPattern): SpeedTick => {
  const move = pattern >>> 31 === 1;
  return { pattern: ((pattern << 1) | (move ? 1 : 0)) >>> 0, move };
};
