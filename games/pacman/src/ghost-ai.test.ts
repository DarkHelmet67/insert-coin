import { describe, expect, it } from 'vitest';
import { DIRECTION, directionStep, type Point } from './geometry';
import {
  chaseTarget,
  chooseAtRandom,
  chooseToward,
  ghostTarget,
  SCATTER_TARGETS,
  squaredDistance,
  type Hunt,
} from './ghost-ai';
import { GHOST, newGhost, type Ghost } from './ghosts';
import { levelSettings } from './levels';
import { newMazeWrites, TILE } from './maze';
import { filledVideo, writeVideo } from './video';

const tiles = writeVideo(filledVideo(TILE.space, 0), newMazeWrites()).tiles;
const speeds = levelSettings(1).speeds;
/** Pac-Man on row 26 below the house, column 13. */
const PACMAN_TILE: Point = { x: 0x2e, y: 0x38 };

/** A hunt with Pac-Man going `direction`. */
const hunt = (direction: 0 | 1 | 2 | 3, blinkyTile: Point = { x: 0x2e, y: 0x2c }): Hunt => ({
  pacmanTile: PACMAN_TILE,
  pacmanStep: directionStep(direction),
  blinkyTile,
});

/** A ghost of the given kind on a tile. */
const ghostOn = (id: 0 | 1 | 2 | 3, tile: Point): Ghost => ({
  ...newGhost(id, speeds),
  nextTile: tile,
});

describe('squaredDistance', () => {
  it('adds the squares of the two gaps', () => {
    expect(squaredDistance({ x: 0x20, y: 0x20 }, { x: 0x23, y: 0x24 })).toBe(25);
  });
});

describe('chooseToward', () => {
  it('never turns back, even toward the target', () => {
    // Blinky above the house going left, target far to the right.
    const way = chooseToward({ x: 0x2e, y: 0x2c }, DIRECTION.left, { x: 0x20, y: 0x2c }, tiles);
    expect(way.direction).not.toBe(DIRECTION.right);
  });

  it('prefers up, then left, then down on a tie', () => {
    // At the crossing on row 8, column 6 (tile $35,$26), going left: a target up-left ties
    // up and left, one down-left ties left and down.
    const tile = { x: 0x35, y: 0x26 };
    const upLeft = { x: 0x36, y: 0x25 };
    const downLeft = { x: 0x36, y: 0x27 };
    expect(chooseToward(tile, DIRECTION.left, upLeft, tiles).direction).toBe(DIRECTION.up);
    expect(chooseToward(tile, DIRECTION.left, downLeft, tiles).direction).toBe(DIRECTION.left);
  });
});

describe('chooseAtRandom', () => {
  it('takes the random direction when it is open', () => {
    // On row 26 going left, the corridor goes on left.
    expect(chooseAtRandom(PACMAN_TILE, DIRECTION.left, DIRECTION.left, tiles).direction).toBe(
      DIRECTION.left,
    );
  });

  it('tries the next directions clockwise when it is closed or backwards', () => {
    // At column 9 of row 26 (tile $32,$38) going left, up is a wall and right turns back:
    // clockwise the next open way is down (counter-clockwise it would be left).
    expect(
      chooseAtRandom({ x: 0x32, y: 0x38 }, DIRECTION.left, DIRECTION.up, tiles).direction,
    ).toBe(DIRECTION.down);
  });
});

describe('chaseTarget', () => {
  it("sends Blinky straight at Pac-Man's tile", () => {
    expect(chaseTarget(ghostOn(GHOST.blinky, PACMAN_TILE), hunt(DIRECTION.left))).toEqual(
      PACMAN_TILE,
    );
  });

  it('sends Pinky 4 tiles ahead of Pac-Man, and also 4 to the left when he goes up', () => {
    const pinky = ghostOn(GHOST.pinky, PACMAN_TILE);
    expect(chaseTarget(pinky, hunt(DIRECTION.left))).toEqual({ x: 0x32, y: 0x38 });
    expect(chaseTarget(pinky, hunt(DIRECTION.down))).toEqual({ x: 0x2e, y: 0x3c });
    expect(chaseTarget(pinky, hunt(DIRECTION.up))).toEqual({ x: 0x32, y: 0x34 });
  });

  it('sends Inky to twice the way from Blinky to 2 tiles ahead of Pac-Man', () => {
    const inky = ghostOn(GHOST.inky, PACMAN_TILE);
    const target = chaseTarget(inky, hunt(DIRECTION.right, { x: 0x2c, y: 0x34 }));
    // Pivot 2 tiles to the right of Pac-Man: x $2C, y $38.
    expect(target).toEqual({ x: 0x2c, y: 0x3c });
  });

  it('sends Clyde home when he is closer than 8 tiles', () => {
    expect(chaseTarget(ghostOn(GHOST.clyde, { x: 0x30, y: 0x38 }), hunt(DIRECTION.left))).toEqual(
      SCATTER_TARGETS[GHOST.clyde],
    );
    expect(chaseTarget(ghostOn(GHOST.clyde, { x: 0x2e, y: 0x20 }), hunt(DIRECTION.left))).toEqual(
      PACMAN_TILE,
    );
  });
});

describe('ghostTarget', () => {
  const context = { hunt: hunt(DIRECTION.left), scatter: true, elroy1: false, tiles };

  it('sends the ghosts to their corners in scatter mode', () => {
    expect(ghostTarget(ghostOn(GHOST.pinky, PACMAN_TILE), context)).toEqual(
      SCATTER_TARGETS[GHOST.pinky],
    );
  });

  it('keeps Cruise Elroy chasing in scatter mode', () => {
    expect(ghostTarget(ghostOn(GHOST.blinky, PACMAN_TILE), { ...context, elroy1: true })).toEqual(
      PACMAN_TILE,
    );
  });
});
