import {
  addPoints,
  DIRECTION,
  directionStep,
  isCentered,
  isTunnelTile,
  isVertical,
  tileAddress,
  tileOf,
  type Direction,
  type Point,
} from './geometry';
import { isWall } from './maze';
import { tickSpeed, type SpeedPattern } from './speed';

/** Pac-Man as the program keeps him ($4D08-$4D4D). */
export interface PacMan {
  /** Pixel position ($4D08). */
  readonly position: Point;
  /** The tile he is on ($4D39). */
  readonly tile: Point;
  /** The step of his next pixel ($4D1C). */
  readonly step: Point;
  /** Where he faces ($4D30). */
  readonly orientation: Direction;
  /** The last direction asked with the joystick ($4D3C). */
  readonly wanted: Direction;
  /** Updates to skip after eating: $FF when none ($4D9D). */
  readonly pause: number;
  /** His speeds: normal ($4D46) and while the ghosts are blue ($4D4A). */
  readonly speed: SpeedPattern;
  readonly frightSpeed: SpeedPattern;
}

/** No pause: Pac-Man moves at his speed. */
export const NO_PAUSE = 0xff;

/** The four directions of the joystick; more than one can be held. */
export interface Joystick {
  readonly up: boolean;
  readonly down: boolean;
  readonly left: boolean;
  readonly right: boolean;
}

/** The joystick at rest. */
export const NO_JOYSTICK: Joystick = { up: false, down: false, left: false, right: false };

/** Pac-Man at the start of a life (task $04 at $2576): below the house, facing left. */
export const newPacMan = (speed: SpeedPattern, frightSpeed: SpeedPattern): PacMan => ({
  position: { x: 0x80, y: 0xc4 },
  tile: { x: 0x2e, y: 0x38 },
  step: directionStep(DIRECTION.left),
  orientation: DIRECTION.left,
  wanted: DIRECTION.left,
  pause: NO_PAUSE,
  speed,
  frightSpeed,
});

/** The direction the joystick asks: the program tests left, right, up, down in this order. */
export const joystickDirection = (joystick: Joystick): Direction | undefined => {
  if (joystick.left) return DIRECTION.left;
  if (joystick.right) return DIRECTION.right;
  if (joystick.up) return DIRECTION.up;
  if (joystick.down) return DIRECTION.down;
  return undefined;
};

/** Whether the tile one `step` away from Pac-Man's tile is a wall (routine $200F). */
const wallAhead = (pacman: PacMan, step: Point, tiles: readonly number[]): boolean =>
  isWall(tiles[tileAddress(addPoints(pacman.tile, step))] ?? 0);

/** Whether Pac-Man is at the middle of his tile along the axis he faces. */
const centeredAlong = (pacman: PacMan, orientation: Direction): boolean =>
  isCentered(isVertical(orientation) ? pacman.position.y : pacman.position.x);

/**
 * In the tunnels only left and right count, and nothing is in the way ($1864).
 */
const steerInTunnel = (pacman: PacMan, joystick: Joystick): PacMan => {
  const direction = joystick.left ? DIRECTION.left : joystick.right ? DIRECTION.right : undefined;
  return direction === undefined
    ? pacman
    : { ...pacman, orientation: direction, step: directionStep(direction) };
};

/** What steering decided: Pac-Man with his new step and orientation, and whether he moves. */
interface Steering {
  readonly pacman: PacMan;
  readonly moves: boolean;
}

/**
 * Chooses Pac-Man's next step in the maze ($18AB-$1940). He turns
 * as soon as the joystick points to an open tile, even before reaching the middle of his own:
 * that is "cornering", and the extra pixels it gains are what lets him escape the ghosts.
 * Facing a wall he goes on to the middle of his tile and stops there.
 */
const steerInMaze = (pacman: PacMan, joystick: Joystick, tiles: readonly number[]): Steering => {
  const asked = joystickDirection(joystick);
  if (asked !== undefined) {
    const turned = { ...pacman, wanted: asked };
    const step = directionStep(asked);
    if (!wallAhead(pacman, step, tiles)) {
      return { pacman: { ...turned, step, orientation: asked }, moves: true };
    }
    const blocked = wallAhead(pacman, pacman.step, tiles);
    return { pacman: turned, moves: !blocked || !centeredAlong(pacman, pacman.orientation) };
  }
  if (!wallAhead(pacman, pacman.step, tiles)) return { pacman, moves: true };
  if (centeredAlong(pacman, pacman.orientation)) return { pacman, moves: false };
  // A quirk of the program ($194A): running into a wall with the joystick at rest, he takes
  // the last direction asked as his orientation, which decides the axis cornering pulls on.
  return { pacman: { ...pacman, orientation: pacman.wanted }, moves: true };
};

/** One pixel toward the middle of the tile, unless already there. */
const towardCenter = (coordinate: number): number => {
  const offset = coordinate & 7;
  if (offset === 4) return coordinate;
  return offset < 4 ? coordinate + 1 : coordinate - 1;
};

/**
 * One pixel along the step and, across it, one pixel toward the middle of the lane ($1950):
 * after cornering, this brings Pac-Man back to the center line of the corridor.
 */
const advance = (pacman: PacMan): PacMan => {
  const moved = addPoints(pacman.position, pacman.step);
  const position = isVertical(pacman.orientation)
    ? { ...moved, x: towardCenter(moved.x) }
    : { ...moved, y: towardCenter(moved.y) };
  return { ...pacman, position, tile: tileOf(position) };
};

/** What happened to Pac-Man in one update. */
export interface PacManMove {
  readonly pacman: PacMan;
  /** He moved inside the maze, so he may eat what is on his tile ($198E). */
  readonly canEat: boolean;
  /** His speed let him move in this update, wall or not ($1843). */
  readonly active: boolean;
}

/**
 * One update of Pac-Man (routine $1806): wait out the pause after a dot, take the next bit of
 * the speed pattern, read the joystick and move one pixel.
 */
export const updatePacMan = (
  pacman: PacMan,
  joystick: Joystick,
  frightened: boolean,
  tiles: readonly number[],
): PacManMove => {
  if (pacman.pause !== NO_PAUSE) {
    return {
      pacman: { ...pacman, pause: (pacman.pause - 1) & 0xff },
      canEat: false,
      active: false,
    };
  }
  const tick = tickSpeed(frightened ? pacman.frightSpeed : pacman.speed);
  const ticked = frightened
    ? { ...pacman, frightSpeed: tick.pattern }
    : { ...pacman, speed: tick.pattern };
  if (!tick.move) return { pacman: ticked, canEat: false, active: false };
  const inTunnel = isTunnelTile(pacman.tile);
  const steered = inTunnel
    ? { pacman: steerInTunnel(ticked, joystick), moves: true }
    : steerInMaze(ticked, joystick, tiles);
  if (!steered.moves) return { pacman: steered.pacman, canEat: false, active: true };
  return { pacman: advance(steered.pacman), canEat: !inTunnel, active: true };
};
