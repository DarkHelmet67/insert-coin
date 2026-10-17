import { DIRECTION, isVertical, type Direction } from './geometry';
import type { PacMan } from './pacman';
import type { HardwareSprite } from './sprites';

/** Pac-Man's palette: yellow. */
export const PACMAN_PALETTE = 9;

/**
 * Pac-Man's sprite for each direction, by pixel within the tile: 0-1, 2-3, 4-5, 6-7 (routines
 * $168C-$171B). $2C and $2D have the mouth wide open, $2E and $2F half open, $30 closed; the
 * ROM draws him facing right and down, left and up are mirror images. As the shape follows
 * the position, he chews only while he moves.
 */
const MOUTH: Readonly<Record<Direction, readonly number[]>> = {
  [DIRECTION.right]: [0x2e, 0x2c, 0x2e, 0x30],
  [DIRECTION.down]: [0x30, 0x2f, 0x2d, 0x2f],
  [DIRECTION.left]: [0x30, 0x2e, 0x2c, 0x2e],
  [DIRECTION.up]: [0x2f, 0x2d, 0x2f, 0x30],
};

/** Pac-Man's sprite, facing where he goes. */
export const pacmanSprite = (pacman: PacMan): HardwareSprite => {
  const { orientation, position } = pacman;
  const pixel = (isVertical(orientation) ? position.y : position.x) & 7;
  return {
    code: MOUTH[orientation][pixel >> 1] ?? 0x30,
    palette: PACMAN_PALETTE,
    flip: { x: orientation === DIRECTION.left, y: orientation === DIRECTION.up },
    x: position.x,
    y: position.y,
  };
};
