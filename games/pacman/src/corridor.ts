import { DIRECTION, directionStep, type Point } from './geometry';
import type { Ghost } from './ghosts';
import type { PacMan } from './pacman';
import type { CellWrite } from './video';

/**
 * The stage of the attract mode's chase and of the intermissions: one row across the screen,
 * between two rows of invisible walls, where the actors run from right to left.
 */

/** An invisible wall: a wall code ($C0 and up) whose picture is empty. */
const INVISIBLE_WALL = 0xfc;
/** The columns of the playfield the walls cover. */
const COLUMNS = 28;

/**
 * The walls above and below the row of the actors (routine $0506): offsets $11 and $13 of
 * every column of the playfield, the actors' row being $12.
 */
export const corridorWalls = (): readonly CellWrite[] =>
  Array.from({ length: COLUMNS }, (_, column) => 0x40 + column * 0x20).flatMap((address) => [
    { address: address + 0x11, value: INVISIBLE_WALL },
    { address: address + 0x13, value: INVISIBLE_WALL },
  ]);

/** The row of the corridor, in pixels and in tiles. */
const ROW_Y = 0x94;
const TILE_Y = 0x32;

/** An actor's place: pixels, tile, and the tile ahead, which starts as its own. */
const place = (x: number, tileX: number): { position: Point; tile: Point; nextTile: Point } => ({
  position: { x, y: ROW_Y },
  tile: { x: tileX, y: TILE_Y },
  nextTile: { x: tileX, y: TILE_Y },
});

/** All going left, the way the actors run in the corridor. */
const LEFT = DIRECTION.left;

/** A ghost at the right edge, just out of the screen, facing left (task $04 with parameter 1, $260F). */
export const corridorGhost = (ghost: Ghost): Ghost => ({
  ...ghost,
  ...place(0x00, 0x1e),
  step: directionStep(LEFT),
  nextStep: directionStep(LEFT),
  orientation: LEFT,
  nextOrientation: LEFT,
});

/** Pac-Man a tile ahead of the ghosts, also facing left ($2665). */
export const corridorPacMan = (pacman: PacMan): PacMan => ({
  ...pacman,
  ...place(0x08, 0x1f),
  step: directionStep(LEFT),
  orientation: LEFT,
  wanted: LEFT,
});
