import { shapeToLines, type BeamLine } from '@arcade/vector';
import { toScreen, type Point } from './position';
import { SHIP_DEBRIS_SHAPES } from './shapes';

/**
 * How fast each piece of the exploding ship flies away [R $10EC], in 1/256 of a screen unit per
 * frame, one pair per piece of SHIP_DEBRIS_SHAPES.
 */
export const DEBRIS_VELOCITIES: readonly (readonly [number, number])[] = [
  [-40, 30],
  [50, -20],
  [0, -60],
  [60, 20],
  [10, 70],
  [-40, -40],
];

/**
 * How many pieces are still visible [P $748E]: all six at the start, then one fewer every 16
 * steps of the status (32 frames), the last pieces of the list vanishing first.
 */
export const debrisCount = (status: number): number => (((0xff - status) & 0x70) >> 4) + 1;

/**
 * How far a piece is from the ship, in screen units [P $746C-$74C5]. It starts a sixteenth of
 * its velocity away (the program shifts the velocity right by 4 into the high byte) and then
 * moves by its velocity every frame.
 */
export const debrisOffset = (velocity: number, age: number): number =>
  ((velocity >> 4) * 256 + velocity * age) / 256;

/**
 * The lines of the exploding ship: each piece is one line of the ROM, drawn at full scale
 * around the place where the ship was.
 */
export const debrisLines = (at: Point, status: number, age: number): readonly BeamLine[] => {
  const center = toScreen(at);
  return SHIP_DEBRIS_SHAPES.slice(0, debrisCount(status)).flatMap((shape, i) => {
    const [vx, vy] = DEBRIS_VELOCITIES[i] ?? [0, 0];
    return shapeToLines(shape, {
      x: center.x + debrisOffset(vx, age),
      y: center.y + debrisOffset(vy, age),
    });
  });
};
