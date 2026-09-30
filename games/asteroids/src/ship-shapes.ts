import type { Placement, VectorShape } from '@arcade/vector';

/** One ship drawing of the ROM and the flame drawn after it while thrusting. */
export interface ShipPicture {
  readonly ship: VectorShape;
  readonly flame: VectorShape;
}

/**
 * The 17 ship drawings of the vector ROM ($126E table), one every 4 direction units from 0
 * (pointing right) to 64 (pointing up), each followed by its flame. The other three quarters of
 * the turn are the same drawings mirrored. Drawn at 1/4 scale.
 */
export const SHIP_PICTURES: readonly ShipPicture[] = [
  // $1290, flame $12A2
  {
    ship: [
      [-24, -16, 0],
      [0, 32, 12],
      [-16, 16, 11],
      [96, -32, 12],
      [-96, -32, 12],
      [16, 16, 11],
    ],
    flame: [
      [-32, 16, 12],
      [32, 16, 12],
    ],
  },
  // $12A8, flame $12C2
  {
    ship: [
      [-22, -18, 0],
      [-3, 32, 12],
      [-17, 14, 12],
      [99, -22, 12],
      [-92, -41, 12],
      [14, 17, 12],
    ],
    flame: [
      [-33, 13, 12],
      [30, 19, 12],
    ],
  },
  // $12CC, flame $12E6
  {
    ship: [
      [-20, -20, 0],
      [-6, 31, 12],
      [-19, 13, 12],
      [100, -13, 12],
      [-88, -50, 12],
      [13, 19, 12],
    ],
    flame: [
      [-35, 9, 12],
      [28, 22, 12],
    ],
  },
  // $12F0, flame $130A
  {
    ship: [
      [-18, -22, 0],
      [-9, 31, 12],
      [-20, 11, 12],
      [101, -3, 12],
      [-83, -58, 12],
      [11, 20, 12],
    ],
    flame: [
      [-35, 6, 12],
      [26, 25, 12],
    ],
  },
  // $1314, flame $132C
  {
    ship: [
      [-16, -24, 0],
      [-12, 30, 12],
      [-21, 9, 12],
      [101, 7, 12],
      [-76, -66, 12],
      [9, 21, 12],
    ],
    flame: [
      [-36, 3, 12],
      [23, 27, 12],
    ],
  },
  // $1336, flame $1350
  {
    ship: [
      [-14, -25, 0],
      [-15, 28, 12],
      [-22, 7, 12],
      [100, 17, 12],
      [-70, -73, 12],
      [7, 22, 12],
    ],
    flame: [
      [-36, -1, 12],
      [21, 29, 12],
    ],
  },
  // $135A, flame $1374
  {
    ship: [
      [-11, -27, 0],
      [-18, 27, 12],
      [-22, 4, 12],
      [98, 27, 12],
      [-62, -80, 12],
      [4, 22, 12],
    ],
    flame: [
      [-35, -4, 12],
      [18, 31, 12],
    ],
  },
  // $137E, flame $1398
  {
    ship: [
      [-8, -28, 0],
      [-20, 25, 12],
      [-23, 2, 12],
      [95, 36, 12],
      [-54, -86, 12],
      [2, 23, 12],
    ],
    flame: [
      [-35, -8, 12],
      [15, 33, 12],
    ],
  },
  // $13A2, flame $13BC
  {
    ship: [
      [-6, -28, 0],
      [-23, 23, 12],
      [-23, 0, 12],
      [91, 45, 12],
      [-45, -91, 12],
      [0, 23, 12],
    ],
    flame: [
      [-34, -11, 12],
      [11, 34, 12],
    ],
  },
  // $13C6, flame $13E0
  {
    ship: [
      [-3, -29, 0],
      [-25, 20, 12],
      [-23, -2, 12],
      [86, 54, 12],
      [-36, -95, 12],
      [-2, 23, 12],
    ],
    flame: [
      [-33, -15, 12],
      [8, 35, 12],
    ],
  },
  // $13EA, flame $1404
  {
    ship: [
      [0, -29, 0],
      [-27, 18, 12],
      [-22, -4, 12],
      [80, 62, 12],
      [-27, -98, 12],
      [-4, 22, 12],
    ],
    flame: [
      [-31, -18, 12],
      [4, 35, 12],
    ],
  },
  // $140E, flame $1428
  {
    ship: [
      [3, -29, 0],
      [-28, 15, 12],
      [-22, -7, 12],
      [73, 70, 12],
      [-17, -100, 12],
      [-7, 22, 12],
    ],
    flame: [
      [-29, -21, 12],
      [1, 36, 12],
    ],
  },
  // $1432, flame $144C
  {
    ship: [
      [6, -28, 0],
      [-30, 12, 12],
      [-21, -9, 12],
      [66, 76, 12],
      [-7, -101, 12],
      [-9, 21, 12],
    ],
    flame: [
      [-27, -23, 12],
      [-3, 36, 12],
    ],
  },
  // $1456, flame $1470
  {
    ship: [
      [8, -28, 0],
      [-31, 9, 12],
      [-20, -11, 12],
      [58, 83, 12],
      [3, -101, 12],
      [-11, 20, 12],
    ],
    flame: [
      [-25, -26, 12],
      [-6, 35, 12],
    ],
  },
  // $147A, flame $1494
  {
    ship: [
      [11, -27, 0],
      [-31, 6, 12],
      [-19, -13, 12],
      [50, 88, 12],
      [13, -100, 12],
      [-13, 19, 12],
    ],
    flame: [
      [-22, -28, 12],
      [-9, 35, 12],
    ],
  },
  // $149E, flame $14B8
  {
    ship: [
      [14, -25, 0],
      [-32, 3, 12],
      [-17, -14, 12],
      [41, 92, 12],
      [22, -99, 12],
      [-14, 17, 12],
    ],
    flame: [
      [-19, -30, 12],
      [-13, 33, 12],
    ],
  },
  // $14C2, flame $14D4
  {
    ship: [
      [16, -24, 0],
      [-32, 0, 12],
      [-16, -16, 12],
      [32, 96, 12],
      [32, -96, 12],
      [-16, 16, 12],
    ],
    flame: [
      [-16, -32, 12],
      [-16, 32, 12],
    ],
  },
];

/** Which ROM drawing shows a direction, and how to mirror it. */
export interface ShipView {
  /** Index into `SHIP_PICTURES`. */
  readonly picture: number;
  readonly flipX: boolean;
  readonly flipY: boolean;
}

/**
 * Picks the drawing for a ship direction (0-255, 0 = right, 64 = up), as the program does at
 * $750B: directions below the horizontal mirror the upper half, directions to the left mirror
 * the right half, and the remaining angle (0-64) is truncated to a multiple of 4. So the ship
 * turns in visible steps of 4 units, about 5.6 degrees.
 */
export const shipView = (direction: number): ShipView => {
  const dir = direction & 0xff;
  const flipY = dir >= 128;
  const upper = flipY ? (256 - dir) & 0xff : dir;
  const flipX = upper >= 64;
  const angle = flipX ? 128 - upper : upper;
  return { picture: angle >> 2, flipX, flipY };
};

/** Scale of the ship drawings: the program draws the ship at 1/4 [P $7018]. */
export const SHIP_SCALE = 1 / 4;

/** Where and how to draw the ship picture chosen by `shipView`. */
export const shipPlacement = (x: number, y: number, view: ShipView): Placement => ({
  x,
  y,
  scale: SHIP_SCALE,
  flipX: view.flipX,
  flipY: view.flipY,
});
