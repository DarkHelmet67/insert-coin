import { alienSprites, type AlienKind } from './sprites';

/** One invader of the formation. */
export interface Alien {
  readonly kind: AlienKind;
  /** Top-left corner of the sprite, in screen pixels. */
  readonly x: number;
  readonly y: number;
}

/** Kind of invader in each of the five rows, from top to bottom. */
export const FORMATION_ROWS: readonly AlienKind[] = ['squid', 'crab', 'crab', 'octopus', 'octopus'];

/** Invaders per row. */
export const FORMATION_COLUMNS = 11;

/** Size of the grid cell holding each invader, and position of the top-left cell. */
export const CELL_SIZE = 16;
export const FORMATION_LEFT = 24;
export const FORMATION_TOP = 64;

/** Width of the widest invader: narrower ones are centered in that space. */
const WIDEST_ALIEN = 12;

/** Points scored for each kind of invader. */
export const ALIEN_POINTS: Readonly<Record<AlienKind, number>> = {
  squid: 30,
  crab: 20,
  octopus: 10,
};

/** Horizontal offset that centers an invader in its column. */
const centerOffset = (kind: AlienKind): number =>
  Math.floor((WIDEST_ALIEN - alienSprites[kind][0].width) / 2);

/** The full formation of 55 invaders at its starting position. */
export const createFormation = (): readonly Alien[] =>
  FORMATION_ROWS.flatMap((kind, row) =>
    Array.from({ length: FORMATION_COLUMNS }, (_, column) => ({
      kind,
      x: FORMATION_LEFT + column * CELL_SIZE + centerOffset(kind),
      y: FORMATION_TOP + row * CELL_SIZE,
    })),
  );
