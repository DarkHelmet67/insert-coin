import { samePoint } from './geometry';
import { GHOST_IDS, type Ghost, type GhostId } from './ghosts';
import type { PacMan } from './pacman';

/** The ghosts in the order the program checks them: Clyde first, Blinky last. */
const CHECK_ORDER: readonly GhostId[] = [...GHOST_IDS].reverse();

/** The first living ghost (in checking order) that meets the test. */
const firstGhost = (
  ghosts: readonly Ghost[],
  test: (ghost: Ghost) => boolean,
): GhostId | undefined =>
  CHECK_ORDER.find((id) => {
    const ghost = ghosts[id];
    return ghost !== undefined && ghost.eyes === 'alive' && test(ghost);
  });

/**
 * The ghost on Pac-Man's tile, if any (routine $171D). Only the tiles count: a ghost and
 * Pac-Man crossing between two updates swap tiles without ever sharing one, and pass through
 * each other.
 */
export const ghostOnTile = (pacman: PacMan, ghosts: readonly Ghost[]): GhostId | undefined =>
  firstGhost(ghosts, (ghost) => samePoint(ghost.tile, pacman.tile));

/**
 * While an energizer works, a second test by pixels (routine $1789): a ghost 0 to 3 pixels
 * from Pac-Man, measured one way only, counts as met too.
 */
export const ghostNearby = (pacman: PacMan, ghosts: readonly Ghost[]): GhostId | undefined =>
  firstGhost(
    ghosts,
    (ghost) =>
      ((ghost.position.y - pacman.position.y) & 0xff) < 4 &&
      ((ghost.position.x - pacman.position.x) & 0xff) < 4,
  );
