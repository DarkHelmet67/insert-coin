import { EXTRA_LIFE } from './rom/main-rom';
import type { CellWrite, VideoWrites } from './video';

/** Slots for the spare lives at the bottom left. */
const SLOTS = 5;
/** The first tile of the little Pac-Man, 2 × 2 tiles from $20. */
const LIFE_TILE = 0x20;
/** The yellow of the lives ($2B70). */
const LIFE_COLOR = 9;
/** Video address of the top-left tile of the first life, the others going right ($2B4A). */
const FIRST_LIFE = 0x01a;

/** The 4 cells of the life in `slot`. */
const lifeCells = (slot: number): readonly number[] => {
  const address = FIRST_LIFE - slot * 2;
  return [address, address + 1, address + 0x20, address + 0x21];
};

/**
 * The spare lives at the bottom left (routine $2B4A): one little Pac-Man for each, blanks for
 * the other slots. With 6 or more the routine gives up and blanks all 5.
 */
export const livesTiles = (shown: number): readonly CellWrite[] => {
  const drawn = shown >= 1 && shown <= SLOTS ? shown : 0;
  return Array.from({ length: SLOTS }, (_, slot) =>
    lifeCells(slot).map((address, k) => ({
      address,
      value: slot < drawn ? LIFE_TILE + k : 0x40,
    })),
  ).flat();
};

/** The lives row with its colors, as task $1A draws it ($2B6A). */
export const livesWrites = (shown: number): VideoWrites => ({
  tiles: livesTiles(shown),
  colors: [0x012, 0x032].flatMap((row) =>
    Array.from({ length: 10 }, (_, i) => ({ address: row + i, value: LIFE_COLOR })),
  ),
});

/** The thousands of a score as the program sees them: 2 BCD digits, tens and units ($2A79). */
const thousands = (score: number): number => {
  const value = Math.floor(score / 1000) % 100;
  return (Math.floor(value / 10) << 4) | (value % 10);
};

/**
 * Whether the score earns the extra life (routine $2A7E): only once per game, when its
 * thousands reach the DIP switch setting (10 000 points on the factory setting; $FF never).
 */
export const earnsExtraLife = (score: number, setting: number, given: boolean): boolean =>
  !given && thousands(score) >= (EXTRA_LIFE[setting] ?? 0xff);
