import { addPoints, DIRECTION, directionStep, oppositeDirection, type Point } from './geometry';
import { GHOST, type Ghost, type GhostId } from './ghosts';

/** The ghosts bob between these two heights while they wait in the house. */
const BOB_TOP = 0x78;
const BOB_BOTTOM = 0x80;
/** The middle of the house, below the door. */
const DOOR_X = 0x80;
/** Just above the door: out of the house. */
const OUTSIDE_Y = 0x64;
/** The tile above the door, where every ghost starts its way in the maze. */
export const DOOR_TILE: Point = { x: 0x2e, y: 0x2c };

/** The ghost moved one pixel in `direction`, facing it. */
const shift = (ghost: Ghost, direction: 0 | 1 | 2 | 3): Ghost => ({
  ...ghost,
  position: addPoints(ghost.position, directionStep(direction)),
  orientation: direction,
  nextOrientation: direction,
});

/** Out through the door: in the maze above it, heading left (as at $0C74). */
const leaveHouse = (ghost: Ghost): Ghost => ({
  ...ghost,
  house: 'out',
  nextTile: DOOR_TILE,
  step: directionStep(DIRECTION.left),
  nextStep: directionStep(DIRECTION.left),
  orientation: DIRECTION.left,
  nextOrientation: DIRECTION.left,
});

/** Waiting: up and down between the two heights, turning at each ($0C9D). */
const bob = (ghost: Ghost): Ghost => {
  const turns = ghost.position.y === BOB_TOP || ghost.position.y === BOB_BOTTOM;
  if (!turns) {
    return {
      ...ghost,
      position: addPoints(ghost.position, ghost.nextStep),
      orientation: ghost.nextOrientation,
    };
  }
  const orientation = oppositeDirection(ghost.orientation);
  const step = directionStep(orientation);
  return {
    ...ghost,
    position: addPoints(ghost.position, step),
    orientation,
    nextOrientation: orientation,
    nextStep: step,
  };
};

/** Inky and Clyde first slide to the middle of the house ($0D34, $0DC8). */
const slide = (ghost: Ghost): Ghost => {
  const moved = shift(ghost, ghost.position.x > DOOR_X ? DIRECTION.right : DIRECTION.left);
  return moved.position.x === DOOR_X ? { ...moved, house: 'up' } : moved;
};

/** Then everyone goes up through the door ($0C56). */
const rise = (ghost: Ghost): Ghost => {
  const moved = shift(ghost, DIRECTION.up);
  return moved.position.y === OUTSIDE_Y ? leaveHouse(moved) : moved;
};

/**
 * One step of a ghost inside the house (routine $0C42). Blinky never waits: back home as eyes,
 * he goes straight up.
 */
export const moveInHouse = (ghost: Ghost): Ghost => {
  if (ghost.eyes !== 'alive') return ghost;
  switch (ghost.house) {
    case 'out':
      return ghost;
    case 'home':
      return ghost.id === GHOST.blinky ? rise(ghost) : bob(ghost);
    case 'sideways':
      return slide(ghost);
    case 'up':
      return rise(ghost);
  }
};

/**
 * The house moves its ghosts one frame out of two: a byte $55 turns one place left each frame
 * and the move happens when a 1 comes out ($0C47).
 */
export const tickHouseClock = (
  clock: number,
): { readonly clock: number; readonly move: boolean } => {
  const move = (clock & 0x80) !== 0;
  return { clock: ((clock << 1) | (move ? 1 : 0)) & 0xff, move };
};

/** The house clock at the start of a life (task $05). */
export const NEW_HOUSE_CLOCK = 0x55;

/** A ghost let out: Pinky goes straight up, Inky and Clyde first slide to the door ($2086). */
export const release = (ghost: Ghost): Ghost =>
  ghost.house === 'home'
    ? { ...ghost, house: ghost.id === GHOST.pinky ? 'up' : 'sideways' }
    : ghost;

/** The first ghost still waiting at home: the timer lets it out first. */
const firstAtHome = (ghosts: readonly Ghost[]): GhostId | undefined =>
  [GHOST.pinky, GHOST.inky, GHOST.clyde].find((id) => ghosts[id]?.house === 'home');

/**
 * When Pac-Man stops eating, a timer lets out the first ghost at home (routine $13DD): the
 * frames restart at each dot eaten, and when they reach the level's limit one ghost leaves.
 */
export const releaseByTimer = (
  ghosts: readonly Ghost[],
  frames: number,
  limit: number,
  justAte: boolean,
): { readonly ghosts: readonly Ghost[]; readonly frames: number } => {
  if (justAte) return { ghosts, frames: 0 };
  const counted = (frames + 1) & 0xffff;
  if (counted !== limit) return { ghosts, frames: counted };
  const id = firstAtHome(ghosts);
  return {
    ghosts: ghosts.map((ghost) => (ghost.id === id ? release(ghost) : ghost)),
    frames: 0,
  };
};
