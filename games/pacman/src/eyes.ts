import { addPoints, DIRECTION, directionStep, samePoint, type Point } from './geometry';
import { stepGhost, type GhostStep } from './ghost-move';
import { GHOST, type Ghost } from './ghosts';
import { DOOR_TILE } from './house';

/** Where the eyes stop above the door: the position where ghosts leave the house. */
const ABOVE_DOOR: Point = { x: 0x80, y: 0x64 };
/** The bottom of the house, where the eyes come back to life. */
const HOUSE_FLOOR = 0x80;

/** Where Inky and Clyde come back to life: their places at the sides ($11A5, $1211). */
const SIDE_PLACES: Readonly<Partial<Record<Ghost['id'], { x: number; tile: Point }>>> = {
  [GHOST.inky]: { x: 0x90, tile: { x: 0x30, y: 0x2f } },
  [GHOST.clyde]: { x: 0x70, tile: { x: 0x2c, y: 0x2f } },
};

/** The tile in the middle of the house, where Blinky and Pinky come back to life. */
const MIDDLE_TILE: Point = { x: 0x2e, y: 0x2f };

/** Alive again, at home, no longer blue, facing down ($10EE). */
const revive = (ghost: Ghost, tile: Point): Ghost => ({
  ...ghost,
  eyes: 'alive',
  house: 'home',
  blue: false,
  tile,
  nextTile: tile,
  orientation: DIRECTION.down,
  nextOrientation: DIRECTION.down,
});

/** One pixel in `direction` inside the house, facing it. */
const shift = (ghost: Ghost, direction: 0 | 1 | 2 | 3): Ghost => ({
  ...ghost,
  position: addPoints(ghost.position, directionStep(direction)),
  orientation: direction,
  nextOrientation: direction,
});

/** Down through the door to the floor of the house ($10D2). */
const goDown = (ghost: Ghost): Ghost => {
  const moved = shift(ghost, DIRECTION.down);
  if (moved.position.y !== HOUSE_FLOOR) return moved;
  return SIDE_PLACES[ghost.id] === undefined
    ? revive(moved, MIDDLE_TILE)
    : { ...moved, eyes: 'sideways' };
};

/** Inky to his place on the left of the house, Clyde to the right ($118F, $11FC). */
const goAside = (ghost: Ghost): Ghost => {
  const place = SIDE_PLACES[ghost.id];
  if (place === undefined) return ghost;
  const moved = shift(ghost, place.x > ghost.position.x ? DIRECTION.left : DIRECTION.right);
  return moved.position.x === place.x ? revive(moved, place.tile) : moved;
};

/**
 * One update of an eaten ghost (routines $1094-$1234). The eyes move one pixel at every
 * update, two per frame, choosing their way toward the tile above the door; once exactly
 * there they go down into the house.
 */
export const updateEyes = (ghost: Ghost, colors: readonly number[]): GhostStep => {
  switch (ghost.eyes) {
    case 'alive':
      return { ghost };
    case 'toDoor': {
      const step = stepGhost(ghost, colors);
      return samePoint(step.ghost.position, ABOVE_DOOR)
        ? { ...step, ghost: { ...step.ghost, eyes: 'down' } }
        : step;
    }
    case 'down':
      return { ghost: goDown(ghost) };
    case 'sideways':
      return { ghost: goAside(ghost) };
  }
};

/** The target of the eyes: the tile above the door ($2842). */
export const EYES_TARGET = DOOR_TILE;
