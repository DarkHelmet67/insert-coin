import { describe, expect, it } from 'vitest';
import { addPoints, earnsExtraLife, ROCK_POINTS } from './score';

describe('addPoints', () => {
  it('adds the points of a rock', () => {
    expect(addPoints(0, ROCK_POINTS[4])).toBe(20);
    expect(addPoints(20, ROCK_POINTS[1])).toBe(120);
  });

  it('starts again from 0 after 99,990', () => {
    expect(addPoints(99990, 50)).toBe(40);
  });
});

describe('earnsExtraLife', () => {
  it('gives a ship at every 10,000 points', () => {
    expect(earnsExtraLife(9980, 10080)).toBe(true);
    expect(earnsExtraLife(10080, 10100)).toBe(false);
    expect(earnsExtraLife(19950, 20000)).toBe(true);
  });

  it('gives one also when the score wraps after 99,990', () => {
    expect(earnsExtraLife(99990, addPoints(99990, 50))).toBe(true);
  });
});
