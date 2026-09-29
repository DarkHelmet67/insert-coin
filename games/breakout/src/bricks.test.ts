import { describe, expect, it } from 'vitest';
import { brickPoints, brickPositions, brickRect, brickShape, fullWall, hasBrick } from './bricks';

describe('bricks', () => {
  it('starts with 112 bricks, 8 rows of 14', () => {
    expect(fullWall().filter(Boolean)).toHaveLength(112);
    expect(brickPositions()[15]).toEqual({ row: 1, column: 1 });
  });

  it('reports missing positions as empty', () => {
    expect(hasBrick(fullWall(), { row: 0, column: 0 })).toBe(true);
    expect(hasBrick(fullWall(), { row: 8, column: 0 })).toBe(false);
  });

  it('places bricks 16 lines apart, 4 steps per row', () => {
    expect(brickRect({ row: 2, column: 3 })).toEqual({ x: 48, y: 48, width: 14, height: 4 });
  });

  it('draws each brick a little shorter, leaving a dark line between rows', () => {
    expect(brickShape({ row: 0, column: 0 }).height).toBeLessThan(4);
  });

  it('scores 7, 5, 3 and 1 point from the top pair of rows down: 448 for a wall', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(brickPoints)).toEqual([7, 7, 5, 5, 3, 3, 1, 1]);
    const total = brickPositions().reduce((sum, { row }) => sum + brickPoints(row), 0);
    expect(total).toBe(448);
  });
});
