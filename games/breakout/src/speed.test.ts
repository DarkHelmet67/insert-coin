import { describe, expect, it } from 'vitest';
import { speedFor } from './speed';

/** The speed after `hits` hits, off an outer or a middle segment. */
const speed = (hits: number, outer: boolean) => speedFor({ hits, fast: false, outer });

describe('speedFor', () => {
  it('starts slow, with a steeper angle off the middle of the paddle', () => {
    expect(speed(0, true)).toEqual({ vertical: 1, sideways: 2 });
    expect(speed(0, false)).toEqual({ vertical: 1, sideways: 1 });
  });

  it('speeds up at the 4th and at the 12th hit', () => {
    expect(speed(3, true).vertical).toBe(1);
    expect(speed(4, true).vertical).toBe(2);
    expect(speed(12, true)).toEqual({ vertical: 2, sideways: 3 });
  });

  it('goes fastest after an orange or red brick, whatever the hits', () => {
    expect(speedFor({ hits: 0, fast: true, outer: false })).toEqual({ vertical: 3, sideways: 3 });
  });

  it('never moves straight up or straight sideways', () => {
    [0, 4, 8, 12].forEach((hits) => {
      [true, false].forEach((outer) => {
        expect(speed(hits, outer).vertical).toBeGreaterThan(0);
        expect(speed(hits, outer).sideways).toBeGreaterThan(0);
      });
    });
  });
});
