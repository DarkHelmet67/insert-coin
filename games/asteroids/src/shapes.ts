import type { VectorShape } from '@arcade/vector';

/**
 * The drawings of the vector ROM (035127.02) used by the game, copied step by step: each step is
 * [dx, dy, brightness] in vector-generator units at scale 1, y upwards; brightness 0 moves the
 * beam without drawing. Every drawing starts from the center of its object. The comments give
 * the ROM address. See docs/meccaniche-originali.md.
 */

/** The four rock outlines ($11DE jump table). Large rocks are drawn at scale 1. */
export const ROCK_SHAPES: readonly VectorShape[] = [
  // $11E6
  [
    [0, 16, 0],
    [16, 16, 7],
    [16, -16, 7],
    [-8, -16, 7],
    [8, -16, 7],
    [-24, -16, 8],
    [-24, 0, 8],
    [-16, 16, 7],
    [0, 32, 7],
    [16, 16, 7],
    [16, -16, 7],
  ],
  // $11FE
  [
    [16, 8, 0],
    [16, 8, 7],
    [-16, 16, 7],
    [-16, -8, 7],
    [-16, 8, 7],
    [-16, -16, 7],
    [8, -16, 7],
    [-8, -16, 7],
    [16, -16, 7],
    [8, 8, 7],
    [24, -8, 8],
    [16, 24, 8],
    [-16, 16, 7],
  ],
  // $121A
  [
    [-16, 0, 0],
    [-16, -8, 7],
    [16, -24, 7],
    [16, 24, 7],
    [0, -24, 7],
    [16, 0, 7],
    [16, 24, 7],
    [0, 16, 7],
    [-16, 24, 7],
    [-24, 0, 7],
    [-24, -24, 7],
    [16, -8, 7],
  ],
  // $1234
  [
    [8, 0, 0],
    [24, 8, 7],
    [0, 8, 6],
    [-24, 16, 7],
    [-24, 0, 7],
    [8, -16, 6],
    [-24, 0, 7],
    [0, -24, 7],
    [16, -24, 7],
    [24, 8, 7],
    [8, -8, 6],
    [16, 16, 6],
    [-24, 16, 7],
  ],
];

/** The flying saucer ($1252): 80 units wide at scale 1, drawn at 1/2 (large) or 1/4 (small). */
export const SAUCER_SHAPE: VectorShape = [
  [-16, 8, 0],
  [32, 0, 12],
  [24, -16, 0],
  [-80, 0, 13],
  [24, -16, 13],
  [32, 0, 12],
  [24, 16, 13],
  [-24, 16, 13],
  [-8, 16, 12],
  [-16, 0, 12],
  [-8, -16, 12],
  [-24, -16, 13],
];

/**
 * The ship icon of the lives counter ($14DA), pointing up. It ends with a move to where the
 * next icon begins, so a row of icons is the same drawing repeated.
 */
export const LIFE_SHAPE: VectorShape = [
  [-16, -24, 0],
  [32, 0, 7],
  [16, -16, 7],
  [-32, 96, 7],
  [-32, -96, 7],
  [16, 16, 7],
  [80, 24, 0],
];

/**
 * The four sizes of the explosion shrapnel ($10F8 jump table): the same ten dots, a little more
 * spread each time, to fill the gaps between the power-of-two scales.
 */
export const SHRAPNEL_SHAPES: readonly VectorShape[] = [
  // $11A0
  [
    [-10, 0, 0],
    [0, 0, 7],
    [-10, -10, 0],
    [0, 0, 7],
    [10, -10, 0],
    [0, 0, 7],
    [15, 5, 0],
    [0, 0, 7],
    [10, -5, 0],
    [0, 0, 7],
    [0, 10, 0],
    [0, 0, 7],
    [5, 15, 0],
    [0, 0, 7],
    [-5, 15, 0],
    [0, 0, 7],
    [-20, -5, 0],
    [0, 0, 7],
    [-15, 5, 0],
    [0, 0, 7],
  ],
  // $116A
  [
    [-12, 0, 0],
    [0, 0, 7],
    [-12, -12, 0],
    [0, 0, 7],
    [12, -12, 0],
    [0, 0, 7],
    [18, 6, 0],
    [0, 0, 7],
    [12, -6, 0],
    [0, 0, 7],
    [0, 12, 0],
    [0, 0, 7],
    [6, 18, 0],
    [0, 0, 7],
    [-6, 18, 0],
    [0, 0, 7],
    [-24, -6, 0],
    [0, 0, 7],
    [-18, 6, 0],
    [0, 0, 7],
  ],
  // $112C
  [
    [-14, 0, 0],
    [0, 0, 7],
    [-14, -14, 0],
    [0, 0, 7],
    [14, -14, 0],
    [0, 0, 7],
    [21, 7, 0],
    [0, 0, 7],
    [14, -7, 0],
    [0, 0, 7],
    [0, 14, 0],
    [0, 0, 7],
    [7, 21, 0],
    [0, 0, 7],
    [-7, 21, 0],
    [0, 0, 7],
    [-28, -7, 0],
    [0, 0, 7],
    [-21, 7, 0],
    [0, 0, 7],
  ],
  // $1100
  [
    [-16, 0, 0],
    [0, 0, 7],
    [-16, -16, 0],
    [0, 0, 7],
    [16, -16, 0],
    [0, 0, 7],
    [24, 8, 0],
    [0, 0, 7],
    [16, -8, 0],
    [0, 0, 7],
    [0, 16, 0],
    [0, 0, 7],
    [8, 24, 0],
    [0, 0, 7],
    [-8, 24, 0],
    [0, 0, 7],
    [-32, -8, 0],
    [0, 0, 7],
    [-24, 8, 0],
    [0, 0, 7],
  ],
];

/** The six pieces of the exploding ship ($10E0), each one a single line. */
export const SHIP_DEBRIS_SHAPES: readonly VectorShape[] = [
  [[-8, -12, 12]],
  [[4, -8, 12]],
  [[6, 2, 12]],
  [[-8, 8, 12]],
  [[-6, 2, 12]],
  [[4, -4, 12]],
];
