import { SCORE_VALUES } from './rom/main-rom';
import type { CellWrite } from './video';

/** The entries of the points table at $2B17, as the program passes them to task $19. */
export const POINTS = {
  dot: 0,
  energizer: 1,
  /** The first ghost eaten; each next one is the following entry. */
  firstGhost: 2,
  /** The cherry; the other fruits follow. */
  firstFruit: 6,
} as const;

/** A BCD number as the program stores it: each 4 bits are one decimal digit. */
const fromBcd = (bcd: number): number => (bcd === 0 ? 0 : (bcd & 0x0f) + 10 * fromBcd(bcd >> 4));

/** The points of entry `index` of the table. */
export const pointsOf = (index: number): number =>
  fromBcd((SCORE_VALUES[index * 2] ?? 0) | ((SCORE_VALUES[index * 2 + 1] ?? 0) << 8));

/** Video address of the rightmost digit of the player's score and of the high score. */
export const SCORE_ADDRESS = 0x3f7;
export const HIGH_SCORE_ADDRESS = 0x3ed;

/** The blank tile, written in place of leading zeros. */
const SPACE = 0x40;

/**
 * The six digits of a score, rightmost at `address` and going left on the top row (routine
 * $2ABE). The first four zeros are blanked, so a score always shows at least "00".
 */
export const scoreWrites = (score: number, address: number): readonly CellWrite[] => {
  const digits = String(score % 1_000_000).padStart(6, '0');
  const leadingZeros = digits.length - digits.replace(/^0+/, '').length;
  const firstShown = Math.min(leadingZeros, 4);
  return [...digits].map((digit, i) => ({
    address: address + (5 - i),
    value: i < firstShown ? SPACE : Number(digit),
  }));
};
