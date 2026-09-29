import { tuning } from './tuning.config';

/** How far the ball moves in one frame: steps down or up, scan lines to the side. */
export interface Speed {
  readonly vertical: number;
  readonly sideways: number;
}

/** What the ball's speed depends on, as in the circuit. */
export interface SpeedState {
  /** Hits counted since the serve. */
  readonly hits: number;
  /** Set by an orange or red brick: the fastest speed until the next serve. */
  readonly fast: boolean;
  /** Whether the ball last touched an outer segment of the paddle (a flatter angle). */
  readonly outer: boolean;
}

/**
 * The ball's speed for the current state. The circuit recomputed it at every frame from a few
 * flip-flops, so the remake does the same instead of storing a velocity.
 */
export const speedFor = ({ hits, fast, outer }: SpeedState): Speed => {
  if (fast) return tuning.fastSpeed;
  const row = tuning.ballSpeeds.filter((entry) => hits >= entry.fromHits).at(-1);
  if (!row) return { vertical: 1, sideways: 1 };
  return { vertical: row.vertical, sideways: outer ? row.outer : row.middle };
};
