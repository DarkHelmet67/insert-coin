import {
  addPoints,
  directionStep,
  oppositeDirection,
  tileAddress,
  type Direction,
  type Point,
} from './geometry';
import { GHOST, type Ghost, type GhostId } from './ghosts';
import { isWall } from './maze';

/** A choice of way: the direction and its step. */
export interface Choice {
  readonly direction: Direction;
  readonly step: Point;
}

/** A direction with its step. */
const choice = (direction: Direction): Choice => ({ direction, step: directionStep(direction) });

/** The square of the difference between two bytes, as the program computes it ($29EA). */
const squaredGap = (a: number, b: number): number => (a - b) ** 2;

/** The squared distance between two tiles: a 16-bit sum, which can wrap ($29EA). */
export const squaredDistance = (a: Point, b: Point): number =>
  (squaredGap(a.x, b.x) + squaredGap(a.y, b.y)) & 0xffff;

/** The directions in the order the program tries them: right, down, left, up. */
const DIRECTIONS: readonly Direction[] = [0, 1, 2, 3];

/**
 * The way out of `tile` that gets closest to `target` (routine $2966). The ghost never turns
 * back and never enters a wall; it measures the distance from the tile each way leads to, in a
 * straight line. On a tie the direction tried last wins, so up beats left, down and right.
 * If no way is open it keeps going where it faces.
 */
export const chooseToward = (
  tile: Point,
  orientation: Direction,
  target: Point,
  tiles: readonly number[],
): Choice => {
  const back = oppositeDirection(orientation);
  const best = DIRECTIONS.reduce<{ direction: Direction; distance: number }>(
    (found, direction) => {
      if (direction === back) return found;
      const next = addPoints(tile, directionStep(direction));
      if (isWall(tiles[tileAddress(next)] ?? 0)) return found;
      const distance = squaredDistance(target, next);
      return distance <= found.distance ? { direction, distance } : found;
    },
    { direction: orientation, distance: 0xffff },
  );
  return choice(best.direction);
};

/**
 * A random way out of `tile` for a blue ghost (routine $291E): the 2 random bits give a
 * direction; if it turns back or meets a wall, the next one clockwise is tried.
 */
export const chooseAtRandom = (
  tile: Point,
  orientation: Direction,
  randomBits: number,
  tiles: readonly number[],
): Choice => {
  const back = oppositeDirection(orientation);
  const tries = DIRECTIONS.map((offset) => ((randomBits + offset) & 3) as Direction);
  const open = tries.find(
    (direction) =>
      direction !== back &&
      !isWall(tiles[tileAddress(addPoints(tile, directionStep(direction)))] ?? 0),
  );
  return choice(open ?? back);
};

/** The corner each ghost goes to in scatter mode, outside the maze (routines $2730-$2800). */
export const SCATTER_TARGETS: Readonly<Record<GhostId, Point>> = {
  [GHOST.blinky]: { x: 0x22, y: 0x1d },
  [GHOST.pinky]: { x: 0x39, y: 0x1d },
  [GHOST.inky]: { x: 0x20, y: 0x40 },
  [GHOST.clyde]: { x: 0x3b, y: 0x40 },
};

/** What a ghost needs to know about Pac-Man and Blinky to pick its target. */
export interface Hunt {
  /** Pac-Man's tile ($4D39) and step ($4D1C). */
  readonly pacmanTile: Point;
  readonly pacmanStep: Point;
  /** Blinky's next tile ($4D0A): Inky aims from it. */
  readonly blinkyTile: Point;
}

/** A tile as the 16-bit word the program adds: x in the high byte, y in the low one. */
const toWord = (point: Point): number => (point.x << 8) | point.y;
/** A 16-bit word back into a tile. */
const fromWord = (word: number): Point => ({ x: (word >> 8) & 0xff, y: word & 0xff });

/**
 * Pac-Man's tile plus `times` steps, added as one 16-bit word like the program does: going
 * up, the step is $00FF and the carry out of y moves the target left as well. That is the
 * famous bug of Pinky's and Inky's aim.
 */
const ahead = (hunt: Hunt, times: number): Point =>
  fromWord(toWord(hunt.pacmanTile) + ((toWord(hunt.pacmanStep) * times) & 0xffff));

/** The chase targets of the four ghosts (routines $2758-$2827). */
export const chaseTarget = (ghost: Ghost, hunt: Hunt): Point => {
  switch (ghost.id) {
    case GHOST.blinky:
      return hunt.pacmanTile;
    case GHOST.pinky:
      return ahead(hunt, 4);
    case GHOST.inky: {
      // Twice the way from Blinky to the tile 2 ahead of Pac-Man, byte by byte.
      const pivot = ahead(hunt, 2);
      return {
        x: (pivot.x * 2 - hunt.blinkyTile.x) & 0xff,
        y: (pivot.y * 2 - hunt.blinkyTile.y) & 0xff,
      };
    }
    case GHOST.clyde:
      // Closer than 8 tiles (64 squared) he runs to his corner.
      return squaredDistance(hunt.pacmanTile, ghost.nextTile) < 0x40
        ? SCATTER_TARGETS[GHOST.clyde]
        : hunt.pacmanTile;
  }
};

/** What the ghosts' decisions depend on, besides the ghost itself. */
export interface DecisionContext {
  readonly hunt: Hunt;
  /** Scatter mode: the mode counter is even ($4DC1 bit 0). */
  readonly scatter: boolean;
  /** Cruise Elroy 1: Blinky keeps chasing in scatter mode ($4DB6). */
  readonly elroy1: boolean;
  readonly tiles: readonly number[];
}

/** The target of a ghost that is not blue (tasks $08-$0B). */
export const ghostTarget = (ghost: Ghost, context: DecisionContext): Point => {
  const scatters = context.scatter && !(ghost.id === GHOST.blinky && context.elroy1);
  return scatters ? SCATTER_TARGETS[ghost.id] : chaseTarget(ghost, context.hunt);
};

/** The ghost with its way out of its next tile chosen. */
export const withChoice = (ghost: Ghost, choice: Choice): Ghost => ({
  ...ghost,
  nextStep: choice.step,
  nextOrientation: choice.direction,
});
