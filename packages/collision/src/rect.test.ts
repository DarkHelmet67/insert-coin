import { describe, expect, it } from 'vitest';
import { intersection, rectsOverlap } from './rect';

const box = { x: 10, y: 10, width: 10, height: 10 };

describe('rectsOverlap', () => {
  it('detects overlapping rectangles', () => {
    expect(rectsOverlap(box, { x: 15, y: 15, width: 10, height: 10 })).toBe(true);
  });

  it('detects a rectangle inside another', () => {
    expect(rectsOverlap(box, { x: 12, y: 12, width: 2, height: 2 })).toBe(true);
  });

  it('rejects rectangles that only touch along an edge', () => {
    expect(rectsOverlap(box, { x: 20, y: 10, width: 5, height: 5 })).toBe(false);
  });

  it('rejects separate rectangles', () => {
    expect(rectsOverlap(box, { x: 0, y: 30, width: 5, height: 5 })).toBe(false);
  });
});

describe('intersection', () => {
  it('returns the shared area', () => {
    expect(intersection(box, { x: 15, y: 18, width: 10, height: 10 })).toEqual({
      x: 15,
      y: 18,
      width: 5,
      height: 2,
    });
  });

  it('is undefined for separate rectangles', () => {
    expect(intersection(box, { x: 50, y: 50, width: 1, height: 1 })).toBeUndefined();
  });
});
