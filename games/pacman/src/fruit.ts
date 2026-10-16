import { samePoint, type Point } from './geometry';
import { FRUIT_ROW, FRUITS } from './rom/main-rom';
import type { CellWrite, VideoWrites } from './video';

/** A level's fruit, from the table at $0EFD: 3 bytes per level. */
export interface FruitKind {
  readonly sprite: number;
  readonly palette: number;
  /** Its entry in the points table, also the number of its points message minus $15. */
  readonly points: number;
}

/** The fruit under the house: present from its release until its timer runs out ($4DD4). */
export interface Fruit {
  readonly kind: FruitKind;
  /** Whether it is still there to eat ($4DD2): once eaten only its points show. */
  readonly shown: boolean;
}

/** From the 21st level on, the fruit is always the key ($0EE1). */
const LAST_FRUIT_ROUND = 0x14;

/** The fruit of round `round`, the level counter of the program (0 for the first level). */
export const fruitOf = (round: number): FruitKind => {
  const at = Math.min(round, LAST_FRUIT_ROUND) * 3;
  return {
    sprite: FRUITS[at] ?? 0,
    palette: FRUITS[at + 1] ?? 0,
    points: FRUITS[at + 2] ?? 0,
  };
};

/** Where the fruit shows up, under the house, and where Pac-Man must be to eat it ($0ED5). */
export const FRUIT_POSITION: Point = { x: 0x80, y: 0x94 };

/** The dots eaten that release the first and the second fruit ($0EBA, $0EBE). */
export const FRUIT_DOTS = [0x46, 0xaa] as const;

/**
 * Which fruit, first or second, comes out now (routine $0EAD): each one only when the dots
 * eaten are exactly its number, if it has not come out yet in this level and no other fruit
 * is around. Returns `undefined` if none.
 */
export const fruitDue = (
  dotsEaten: number,
  released: readonly boolean[],
  fruit: Fruit | undefined,
): number | undefined => {
  if (fruit !== undefined) return undefined;
  const which = FRUIT_DOTS.findIndex((dots) => dots === dotsEaten);
  return which >= 0 && released[which] !== true ? which : undefined;
};

/** Whether Pac-Man eats the fruit: he must be exactly on its pixel ($19A7). */
export const eatsFruit = (fruit: Fruit | undefined, position: Point): boolean =>
  fruit?.shown === true && samePoint(position, FRUIT_POSITION);

/** The message with the points of a fruit, written under the house ($19B8). */
export const fruitPointsText = (kind: FruitKind): number => kind.points + 0x15;

/** The messages that erase a fruit's points: the short one and the longest ($100B). */
export const FRUIT_TEXTS_ERASED = [0x1b, 0x22] as const;

/** The 4 cells of a 2 × 2 picture at `address` on the bottom rows ($2B8F). */
const square = (address: number): readonly number[] => [
  address,
  address + 1,
  address + 0x20,
  address + 0x21,
];

/** Fruit slots in the row at the bottom right. */
const SLOTS = 7;

/**
 * How many fruits the row shows and from which entry of the table (routine $2BEA): the fruits
 * of the levels played so far, at most the last 7, up to the key. The level counter is one
 * byte: at level 256 the program asks for 0 fruits, and its loop counts 0 as 256.
 */
const fruitsShown = (round: number): { first: number; count: number } => {
  const level = (round + 1) & 0xff;
  if (level >= 8) return { first: Math.min(level, 0x13) - SLOTS, count: SLOTS };
  return { first: 0, count: level === 0 ? 256 : level };
};

/**
 * The fruits at the bottom right of the screen (routine $2BEA), each 4 tiles and one color
 * from the table at $3B08, then blanks for the empty slots. On level 256 the 256 fruits read
 * on into the following ROM bytes and run over half of the maze: the famous split screen.
 */
export const fruitRowWrites = (round: number): VideoWrites => {
  const { first, count } = fruitsShown(round);
  const fruitCells = Array.from({ length: count }, (_, i) => {
    const tile = FRUIT_ROW[(first + i) * 2] ?? 0;
    const color = FRUIT_ROW[(first + i) * 2 + 1] ?? 0;
    return square(4 + i * 2).map((address, k) => ({
      address: address & 0x3ff,
      tile: (tile + k) & 0xff,
      color,
    }));
  }).flat();
  const blanks = Array.from({ length: (SLOTS - count) & 0xff }, (_, i) =>
    square(4 + (count + i) * 2).map((address) => ({
      address: address & 0x3ff,
      tile: 0x40,
      color: 0,
    })),
  ).flat();
  const cells = [...fruitCells, ...blanks];
  return {
    tiles: cells.map(({ address, tile }): CellWrite => ({ address, value: tile })),
    colors: cells.map(({ address, color }): CellWrite => ({ address, value: color })),
  };
};
