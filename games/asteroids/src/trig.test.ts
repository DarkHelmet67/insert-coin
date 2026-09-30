import { describe, expect, it } from 'vitest';
import { cosine, sine, SINE_TABLE } from './trig';

describe('SINE_TABLE', () => {
  it('holds a quarter turn in 65 steps, rounded from a real sine', () => {
    expect(SINE_TABLE).toHaveLength(65);
    SINE_TABLE.forEach((value, index) => {
      expect(Math.abs(value - 127 * Math.sin(((index * 90) / 64) * (Math.PI / 180)))).toBeLessThan(
        1.1,
      );
    });
  });
});

describe('sine and cosine', () => {
  it('give the four main directions', () => {
    expect([cosine(0), sine(0)]).toEqual([127, 0]);
    expect([cosine(64), sine(64)]).toEqual([0, 127]);
    expect([cosine(128), sine(128)]).toEqual([-127, 0]);
    expect([cosine(192), sine(192)]).toEqual([0, -127]);
  });

  it('follow the symmetries of the circle', () => {
    expect(sine(32)).toBe(sine(96));
    expect(sine(160)).toBe(-sine(32));
    expect(sine(300)).toBe(sine(44));
  });
});
