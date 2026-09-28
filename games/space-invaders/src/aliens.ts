import { alienSprites, type AlienKind } from './sprites';

/** One invader of the formation. */
export interface Alien {
  readonly kind: AlienKind;
  /** Row in the formation, 1 (top) to 5 (bottom): decides the invader's color. */
  readonly row: number;
  /** Column in the formation, 1 (left) to 11 (right): used by the bomb firing tables. */
  readonly column: number;
  /** Top-left corner of the sprite, in screen pixels. */
  readonly x: number;
  readonly y: number;
  /** Animation frame: each invader switches frame every time it moves. */
  readonly frame: 0 | 1;
}

/** Kind of invader in each of the five rows, from top to bottom. */
export const FORMATION_ROWS: readonly AlienKind[] = ['squid', 'crab', 'crab', 'octopus', 'octopus'];

/** Invaders per row. */
export const FORMATION_COLUMNS = 11;

/** Size of the grid cell holding each invader, and left edge of the first column. */
export const CELL_SIZE = 16;
export const FORMATION_LEFT = 24;

/**
 * Height of the bottom row at the start of each round (rounds 1 to 8, then the cycle repeats).
 * Every new round starts lower, so the invaders arrive sooner: from the original's start table,
 * converted from its rotated coordinates to ours.
 */
export const ROUND_START_BOTTOM_Y: readonly number[] = [128, 168, 176, 176, 176, 184, 184, 184];

/** Width of the widest invader: narrower ones are centered in that space. */
const WIDEST_ALIEN = 12;

/** Points scored for each kind of invader. */
export const ALIEN_POINTS: Readonly<Record<AlienKind, number>> = {
  squid: 30,
  crab: 20,
  octopus: 10,
};

/** Width in pixels of an invader's sprite. */
export const alienWidth = (alien: Pick<Alien, 'kind'>): number => alienSprites[alien.kind][0].width;

/** Horizontal offset that centers an invader in its column. */
const centerOffset = (kind: AlienKind): number =>
  Math.floor((WIDEST_ALIEN - alienSprites[kind][0].width) / 2);

/** Height of the bottom row at the start of `round` (1-based). */
export const startBottomY = (round: number): number =>
  ROUND_START_BOTTOM_Y[(round - 1) % ROUND_START_BOTTOM_Y.length] ?? 128;

/**
 * The full formation of 55 invaders at the start of `round`.
 * The list is in marching order, as in the original: bottom row first, left to right.
 */
export const createFormation = (round = 1): readonly Alien[] =>
  [...FORMATION_ROWS].reverse().flatMap((kind, rowFromBottom) =>
    Array.from({ length: FORMATION_COLUMNS }, (_, index) => ({
      kind,
      row: FORMATION_ROWS.length - rowFromBottom,
      column: index + 1,
      x: FORMATION_LEFT + index * CELL_SIZE + centerOffset(kind),
      y: startBottomY(round) - rowFromBottom * CELL_SIZE,
      frame: 0 as const,
    })),
  );
