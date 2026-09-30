import { describe, expect, it } from 'vitest';
import { addPoints, ROCK_POINTS } from './score';

describe('addPoints', () => {
  it('adds the points of a rock', () => {
    expect(addPoints(0, ROCK_POINTS[4])).toBe(20);
    expect(addPoints(20, ROCK_POINTS[1])).toBe(120);
  });

  it('starts again from 0 after 99,990', () => {
    expect(addPoints(99990, 50)).toBe(40);
  });
});
