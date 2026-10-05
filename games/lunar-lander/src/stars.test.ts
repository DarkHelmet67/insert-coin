import { describe, expect, it } from 'vitest';
import { closeUpOn, startingCamera } from './camera';
import { starLines } from './stars';
import { MAJOR_HIGH_STARS, MAJOR_STARS } from './surface-data';

describe('the stars', () => {
  it('shows the high field of the whole view only during a game', () => {
    expect(starLines(startingCamera, false)).toHaveLength(MAJOR_STARS.length);
    expect(starLines(startingCamera, true)).toHaveLength(
      MAJOR_STARS.length + MAJOR_HIGH_STARS.length,
    );
  });

  it('draws dots', () => {
    starLines(startingCamera, true).forEach((star) => {
      expect([star.x1, star.y1]).toEqual([star.x2, star.y2]);
    });
  });

  it('shows the close-up field around the module', () => {
    expect(starLines(closeUpOn(1000, 1500), true).length).toBeGreaterThan(0);
  });
});
