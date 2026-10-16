import { DIRECTION, directionStep, type Direction, type Point } from './geometry';
import type { LevelSpeeds } from './levels';
import type { SpeedPattern } from './speed';

/** The four ghosts, in the order of the program's tables. */
export const GHOST = { blinky: 0, pinky: 1, inky: 2, clyde: 3 } as const;

/** One of the four ghosts. */
export type GhostId = (typeof GHOST)[keyof typeof GHOST];

/** Every ghost, in table order. */
export const GHOST_IDS: readonly GhostId[] = [GHOST.blinky, GHOST.pinky, GHOST.inky, GHOST.clyde];

/** The speed patterns a ghost turns, one at a time (Blinky also has the two Elroy ones). */
export interface GhostSpeeds {
  readonly normal: SpeedPattern;
  readonly fright: SpeedPattern;
  readonly tunnel: SpeedPattern;
}

/** A ghost as the program keeps it, in four parallel tables ($4D00-$4DAF). */
export interface Ghost {
  readonly id: GhostId;
  /** Pixel position ($4D00). */
  readonly position: Point;
  /** The tile it is on ($4D31). */
  readonly tile: Point;
  /**
   * The tile it is heading for ($4D0A): one tile ahead, because the ghost chooses its way out
   * of a tile when it reaches the middle of the one before.
   */
  readonly nextTile: Point;
  /** The step of its next pixel ($4D14) and the one it will take at the next tile ($4D1E). */
  readonly step: Point;
  readonly nextStep: Point;
  /** Where it goes ($4D28) and where it will turn ($4D2C): its eyes already look there. */
  readonly orientation: Direction;
  readonly nextOrientation: Direction;
  /** Out of the house and free to roam ($4DA0): the house states come with the house. */
  readonly out: boolean;
  /** Blue, after an energizer ($4DA7). */
  readonly blue: boolean;
  /** Must turn around at the middle of its next tile ($4DB1). */
  readonly reverse: boolean;
  readonly speeds: GhostSpeeds;
}

/** Where each ghost starts a life (task $04 at $2576). */
const STARTS: readonly { readonly position: Point; readonly orientation: Direction }[] = [
  { position: { x: 0x80, y: 0x64 }, orientation: DIRECTION.left },
  { position: { x: 0x80, y: 0x7c }, orientation: DIRECTION.down },
  { position: { x: 0x90, y: 0x7c }, orientation: DIRECTION.up },
  { position: { x: 0x70, y: 0x7c }, orientation: DIRECTION.up },
];

/** The tiles the program writes for each start: they are not those of the positions. */
const START_TILES: readonly Point[] = [
  { x: 0x2e, y: 0x2c },
  { x: 0x2e, y: 0x2f },
  { x: 0x30, y: 0x2f },
  { x: 0x2c, y: 0x2f },
];

/** A ghost at the start of a life. Only Blinky starts outside the house. */
export const newGhost = (id: GhostId, speeds: LevelSpeeds): Ghost => {
  const start = STARTS[id] ?? { position: { x: 0x80, y: 0x64 }, orientation: DIRECTION.left };
  const tile = START_TILES[id] ?? { x: 0x2e, y: 0x2c };
  const step = directionStep(start.orientation);
  return {
    id,
    position: start.position,
    tile,
    nextTile: tile,
    step,
    nextStep: step,
    orientation: start.orientation,
    nextOrientation: start.orientation,
    out: id === GHOST.blinky,
    blue: false,
    reverse: false,
    speeds: { normal: speeds.ghost, fright: speeds.ghostFright, tunnel: speeds.ghostTunnel },
  };
};
