import { GHOST, type Ghost, type GhostId } from './ghosts';
import { release } from './house';

/** The house's dot counting ($4E0F-$4E12, $4D9F). */
export interface HouseDots {
  /** Dots counted for Pinky, Inky and Clyde since the level started. */
  readonly personal: readonly [number, number, number];
  /** After a death the house uses a single counter instead, until Clyde leaves with it. */
  readonly global: number | undefined;
}

/** The counters at the start of a level. */
export const NEW_HOUSE_DOTS: HouseDots = { personal: [0, 0, 0], global: undefined };

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
  const [pinky, inky, clyde] = dots.personal;
  const personal: HouseDots['personal'] = [
    pinky + (id === GHOST.pinky ? 1 : 0),
    inky + (id === GHOST.inky ? 1 : 0),
    clyde + (id === GHOST.clyde ? 1 : 0),
  ];
  return { ...dots, personal };
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
