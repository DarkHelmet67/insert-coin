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

/** The house's dot counting ($4E0F-$4E12, $4D9F). */
export interface HouseDots {
  /** Dots counted for Pinky, Inky and Clyde since the level started. */
  readonly personal: readonly [number, number, number];
  /** After a death the house uses a single counter instead, until Clyde leaves with it. */
  readonly global: number | undefined;
}

/** The counters at the start of a level. */
export const NEW_HOUSE_DOTS: HouseDots = { personal: [0, 0, 0], global: undefined };

/** The first ghost still waiting at home: the timer lets it out first. */
const firstAtHome = (ghosts: readonly Ghost[]): GhostId | undefined =>
  [GHOST.pinky, GHOST.inky, GHOST.clyde].find((id) => ghosts[id]?.house === 'home');

/**
 * The ghost whose personal counter counts the dots ($1B14): none once Clyde is out, then the
 * one after the last ghost that left.
 */
const counting = (ghosts: readonly Ghost[]): GhostId | undefined => {
  /** Whether a ghost is still waiting at home. */
  const atHome = (id: GhostId): boolean => ghosts[id]?.house === 'home';
  if (!atHome(GHOST.clyde)) return undefined;
  if (!atHome(GHOST.inky)) return GHOST.clyde;
  if (!atHome(GHOST.pinky)) return GHOST.inky;
  return GHOST.pinky;
};

/**
 * A dot eaten (routine $1B08): it counts for the global counter after a death, otherwise for
 * the first ghost at home, but only while Clyde is still waiting.
 */
export const countDot = (dots: HouseDots, ghosts: readonly Ghost[]): HouseDots => {
  if (dots.global !== undefined) return { ...dots, global: dots.global + 1 };
  const id = counting(ghosts);
  if (id === undefined) return dots;
  const personal = dots.personal.map((count, i) => (i === id - 1 ? count + 1 : count));
  return { ...dots, personal: personal as unknown as HouseDots['personal'] };
};

/** The global counter's limits for Pinky, Inky and Clyde ($2078, $209B, $20BE). */
const GLOBAL_LIMITS = [7, 17, 32] as const;

/** The ghosts let out and the counters after one check. */
export interface Releases {
  readonly ghosts: readonly Ghost[];
  readonly dots: HouseDots;
}

/**
 * Lets a waiting ghost out when its counter reaches its limit (routines $2069, $208C, $20AF).
 * With the global counter, Pinky leaves at 7 and Inky at 17; at 32, if Clyde is still home,
 * the global counter is dropped and the personal ones count again.
 */
export const releaseByDots = (
  ghosts: readonly Ghost[],
  dots: HouseDots,
  limits: readonly [number, number, number],
): Releases =>
  [GHOST.pinky, GHOST.inky, GHOST.clyde].reduce<Releases>(
    (state, id) => {
      const ghost = state.ghosts[id];
      if (ghost?.house !== 'home') return state;
      const index = id - 1;
      const { global } = state.dots;
      if (global !== undefined) {
        if (global !== GLOBAL_LIMITS[index]) return state;
        if (id === GHOST.clyde) return { ...state, dots: { ...state.dots, global: undefined } };
      } else if ((state.dots.personal[index] ?? 0) < (limits[index] ?? 0)) {
        return state;
      }
      return {
        ...state,
        ghosts: state.ghosts.map((other) => (other.id === id ? release(other) : other)),
      };
    },
    { ghosts, dots },
  );

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
