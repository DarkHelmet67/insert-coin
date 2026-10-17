import type { GhostId } from './ghosts';

/**
 * A ghost being eaten ($4DA4, $4DD1): for about a second the game stands still, Pac-Man
 * disappears and the ghost shows its points; then it turns into eyes.
 */
export interface Eating {
  readonly ghost: GhostId;
  /** 'meet' before the points show, 'show' while they do, 'done' once the second is over. */
  readonly phase: 'meet' | 'show' | 'done';
  /** Frames left of the points on screen. */
  readonly frames: number;
}

/** A ghost just met while blue. */
export const startEating = (ghost: GhostId): Eating => ({ ghost, phase: 'meet', frames: 0 });

/**
 * One update of the game core while a ghost is eaten (routine $1235): the points show, and
 * once the timer has run the ghost is handed over to the eyes. Returns `undefined` when the
 * eating is over.
 */
export const updateEating = (eating: Eating, showFrames: number): Eating | undefined => {
  switch (eating.phase) {
    case 'meet':
      return { ...eating, phase: 'show', frames: showFrames };
    case 'show':
      return eating;
    case 'done':
      return undefined;
  }
};

/** The timer of the points, one frame (timed task $4A at $126E). */
export const tickEating = (eating: Eating): Eating => {
  if (eating.phase !== 'show') return eating;
  const frames = eating.frames - 1;
  return frames === 0 ? { ...eating, phase: 'done', frames } : { ...eating, frames };
};
