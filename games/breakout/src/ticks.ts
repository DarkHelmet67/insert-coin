import { tuning } from './tuning.config';

/**
 * The brick ticks: the circuit adds the points of a brick one at a time and ticks at each one,
 * so the ticks trail behind the ball. Here the points owed are counted and paid out one tick
 * every `tickFrames` frames.
 */
export interface Ticks {
  /** Points scored but not ticked yet. */
  readonly owed: number;
  /** Ticks played since the game started: the sounds follow its increases. */
  readonly played: number;
  /** Frames left before the next tick may play. */
  readonly wait: number;
}

/** No ticks owed or played: the start of a game. */
export const noTicks: Ticks = { owed: 0, played: 0, wait: 0 };

/** Adds the points scored in this frame and plays the next tick when it is due. */
export const updateTicks = (ticks: Ticks, points: number): Ticks => {
  const owed = ticks.owed + points;
  if (ticks.wait > 0) return { ...ticks, owed, wait: ticks.wait - 1 };
  if (owed === 0) return ticks;
  return { owed: owed - 1, played: ticks.played + 1, wait: tuning.sounds.tickFrames - 1 };
};
