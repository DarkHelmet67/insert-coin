import { moveActors, type Movers } from './intermission-moves';
import { GHOST, type Ghost } from './ghosts';
import type { Point } from './geometry';
import type { Playing } from './playing';

/** The pieces the steps of the intermissions are made of. */

/** What one frame of a scene did. */
export interface SceneFrame {
  readonly playing: Playing;
  /** On to the next step. */
  readonly advance?: boolean;
  /** A timer to wait for in the next step, as its code byte. */
  readonly timer?: number;
  /** The scene is over. */
  readonly done?: boolean;
  /** Where the third scene's sheet is drawn ($4DD2). */
  readonly sheet?: Point;
}

/** One step of a scene. */
export type Step = (playing: Playing) => SceneFrame;

/** A step that waits for its timer ($000C in the tables). */
export const wait: Step = (playing) => ({ playing });

/**
 * Blinky, the only ghost of the intermissions.
 * @throws Error if the game has no ghosts, which would be a bug.
 */
export const blinkyOf = (playing: Playing): Ghost => {
  const blinky = playing.ghosts[GHOST.blinky];
  if (blinky === undefined) throw new Error('Blinky is missing');
  return blinky;
};

/** The tile column of Pac-Man ($4D3A). */
export const pacTileX = (playing: Playing): number => playing.pacman.tile.x;
/** The tile column of Blinky ($4D32). */
export const blinkyTileX = (playing: Playing): number => blinkyOf(playing).tile.x;
/** Blinky's pixel column ($4D01). */
export const blinkyX = (playing: Playing): number => blinkyOf(playing).position.x;

/** A step that does `then` once `ready` holds, and meanwhile moves `movers`. */
export const until =
  (
    ready: (playing: Playing) => boolean,
    movers: Movers,
    then: (playing: Playing) => SceneFrame = (playing) => ({ playing, advance: true }),
  ): Step =>
  (playing) =>
    ready(playing) ? then(playing) : { playing: moveActors(playing, movers) };
