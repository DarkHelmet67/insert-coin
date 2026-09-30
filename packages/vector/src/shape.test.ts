import { describe, expect, it } from 'vitest';
import { shapeEnd, shapeToLines, transformOffset, type VectorShape } from './shape';

/** A 10 x 10 square drawn from its bottom-left corner, after a blank move from the center. */
const SQUARE: VectorShape = [
  [-5, -5, 0],
  [10, 0, 7],
  [0, 10, 7],
  [-10, 0, 7],
  [0, -10, 7],
];

describe('shapeToLines', () => {
  it('skips blank moves and chains the lines from the placement point', () => {
    const lines = shapeToLines(SQUARE, { x: 100, y: 200 });
    expect(lines).toHaveLength(4);
    expect(lines[0]).toEqual({ x1: 95, y1: 195, x2: 105, y2: 195, brightness: 7 });
    expect(lines[3]).toEqual({ x1: 95, y1: 205, x2: 95, y2: 195, brightness: 7 });
  });

  it('scales every step', () => {
    const [first] = shapeToLines(SQUARE, { x: 0, y: 0, scale: 2 });
    expect(first).toEqual({ x1: -10, y1: -10, x2: 10, y2: -10, brightness: 7 });
  });

  it('keeps zero-length steps as dots', () => {
    expect(shapeToLines([[0, 0, 15]], { x: 3, y: 4 })).toEqual([
      { x1: 3, y1: 4, x2: 3, y2: 4, brightness: 15 },
    ]);
  });
});

describe('transformOffset', () => {
  it('rotates counterclockwise with y upwards', () => {
    const { dx, dy } = transformOffset(1, 0, { x: 0, y: 0, angle: Math.PI / 2 });
    expect(dx).toBeCloseTo(0);
    expect(dy).toBeCloseTo(1);
  });

  it('mirrors before scaling', () => {
    expect(transformOffset(2, 3, { x: 0, y: 0, flipX: true, scale: 2 })).toEqual({
      dx: -4,
      dy: 6,
    });
    expect(transformOffset(2, 3, { x: 0, y: 0, flipY: true })).toEqual({ dx: 2, dy: -3 });
  });
});

describe('shapeEnd', () => {
  it('sums every step, blank or lit', () => {
    expect(shapeEnd(SQUARE)).toEqual({ dx: -5, dy: -5 });
  });
});
