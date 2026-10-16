import { RANDOM_BITS } from './rom/random-bits';

/**
 * The program's random numbers (routine $2A23): a pointer that goes to pointer × 5 + 1 within
 * $0000-$1FFF, and the program byte it points to. The ghosts use only its 2 low bits.
 */
export interface RandomDraw {
  readonly seed: number;
  /** The 2 low bits of the program byte at the new pointer. */
  readonly bits: number;
}

/** The next random draw after `seed`. */
export const drawRandom = (seed: number): RandomDraw => {
  const next = (seed * 5 + 1) & 0x1fff;
  return { seed: next, bits: ((RANDOM_BITS[next >> 2] ?? 0) >> ((next & 3) * 2)) & 3 };
};
