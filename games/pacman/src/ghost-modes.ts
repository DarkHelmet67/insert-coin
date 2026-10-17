import type { ElroyState } from './ghost-move';

/** The scatter/chase clock ($4DC1, $4DC2). */
export interface ModeClock {
  /** Changes so far: even means scatter, odd chase; after 7 the ghosts chase forever. */
  readonly index: number;
  /** Frames counted toward the next change. */
  readonly frames: number;
}

/** The clock at the start of a level or a life: scatter. */
export const NEW_MODE_CLOCK: ModeClock = { index: 0, frames: 0 };

/** The last change: from then on the ghosts chase. */
const LAST_CHANGE = 7;

/** Whether the ghosts scatter to their corners. */
export const isScatter = (clock: ModeClock): boolean => (clock.index & 1) === 0;

/** One frame of the clock, and whether the ghosts must turn around now. */
export interface ModeTick {
  readonly clock: ModeClock;
  readonly reverse: boolean;
}

/**
 * One frame of the scatter/chase clock (routine $0E36). It stands still while the ghosts are
 * blue. Each change makes all the ghosts turn around.
 */
export const tickModes = (
  clock: ModeClock,
  changes: readonly number[],
  energized: boolean,
): ModeTick => {
  if (energized || clock.index === LAST_CHANGE) return { clock, reverse: false };
  const frames = (clock.frames + 1) & 0xffff;
  if (frames !== changes[clock.index]) return { clock: { ...clock, frames }, reverse: false };
  return { clock: { index: clock.index + 1, frames }, reverse: true };
};

/** Blinky as a normal ghost. */
export const NO_ELROY: ElroyState = { elroy1: false, elroy2: false };

/** Dots and energizers in a maze. */
export const MAZE_FOOD = 0xf4;

/**
 * Cruise Elroy (routine $20D7): once Clyde has left the house, Blinky speeds up when the dots
 * left fall to the level's two limits. It never goes back within a life.
 */
export const updateElroy = (
  elroy: ElroyState,
  dotsEaten: number,
  limits: readonly [number, number],
  clydeOut: boolean,
): ElroyState => {
  if (!clydeOut) return elroy;
  const left = MAZE_FOOD - dotsEaten;
  return {
    elroy1: elroy.elroy1 || left <= limits[0],
    elroy2: elroy.elroy2 || ((elroy.elroy1 || left <= limits[0]) && left <= limits[1]),
  };
};
