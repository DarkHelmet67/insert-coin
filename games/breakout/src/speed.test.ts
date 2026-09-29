import { describe, expect, it } from 'vitest';
import { speedFor } from './speed';
import { tuning } from './tuning.config';

/** The speed after `hits` hits, off an outer or a middle segment. */
const speed = (hits: number, outer: boolean) => speedFor({ hits, fast: false, outer });

/** The total distance per frame, counting that a step is 1.48 times a scan line. */
const pace = ({ vertical, sideways }: { vertical: number; sideways: number }) =>
  Math.hypot(vertical * 1.48, sideways);

describe('speedFor', () => {
  it('takes a flatter angle off the outer segments than off the middle ones', () => {
    expect(speed(0, true).sideways).toBeGreaterThan(speed(0, false).sideways);
    expect(speed(0, true).vertical).toBe(speed(0, false).vertical);
  });

  it('speeds up at the 4th and at the 12th hit', () => {
    expect(speed(3, true)).toEqual(speed(0, true));
    expect(speed(4, true).vertical).toBeGreaterThan(speed(3, true).vertical);
    expect(pace(speed(12, true))).toBeGreaterThan(pace(speed(4, true)));
  });

  it('goes fastest after an orange or red brick, whatever the hits', () => {
    expect(speedFor({ hits: 0, fast: true, outer: false })).toEqual(tuning.fastSpeed);
    expect(pace(tuning.fastSpeed)).toBeGreaterThan(pace(speed(12, true)));
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
