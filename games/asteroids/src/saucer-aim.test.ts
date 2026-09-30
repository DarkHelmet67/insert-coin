import { describe, expect, it } from 'vitest';
import { aimAxis, aimDirection, aimError, arctan, toSigned8 } from './saucer-aim';

describe('toSigned8', () => {
  it('reads a byte with a sign', () => {
    expect([0, 127, 128, 255, 256 + 5, -3].map(toSigned8)).toEqual([0, 127, -128, -1, 5, -3]);
  });
});

describe('arctan', () => {
  it('points along the axes', () => {
    expect(arctan(10, 0)).toBe(0);
    expect(arctan(0, 10)).toBe(64);
    expect(arctan(-10, 0)).toBe(128);
    expect(arctan(0, -10)).toBe(192);
  });

  it('gives 45 degrees on the diagonals, and for (0, 0)', () => {
    expect(arctan(7, 7)).toBe(32);
    expect(arctan(-7, 7)).toBe(96);
    expect(arctan(-7, -7)).toBe(160);
    expect(arctan(7, -7)).toBe(224);
    expect(arctan(0, 0)).toBe(32);
  });

  it('is close to the real angle everywhere', () => {
    [
      [100, 30],
      [30, 100],
      [-80, 50],
      [-20, -90],
      [60, -110],
    ].forEach(([x = 0, y = 0]) => {
      const real = ((Math.atan2(y, x) / (2 * Math.PI)) * 256 + 256) % 256;
      const error = Math.abs(((arctan(x, y) - real + 384) % 256) - 128);
      expect(error).toBeLessThan(3);
    });
  });
});

describe('aimAxis', () => {
  it('counts the distance in blocks of 64 units, minus half the saucer speed', () => {
    expect(aimAxis(1000, 0, 0)).toBe(15);
    expect(aimAxis(0, 1000, 0)).toBe(-16);
    expect(aimAxis(1000, 0, 16)).toBe(7);
  });

  it('keeps the result in one signed byte, as the program does', () => {
    expect(aimAxis(8000, 0, -16)).toBe(toSigned8(125 + 8));
  });
});

describe('aimDirection', () => {
  it('points at the ship', () => {
    const saucer = { position: { x: 1000, y: 1000 }, vx: 0, vy: 0 };
    expect(aimDirection(saucer, { x: 3000, y: 1000 })).toBe(0);
    expect(aimDirection(saucer, { x: 1000, y: 3000 })).toBe(64);
  });
});

describe('aimError', () => {
  it('is -16..+15 below 35,000 points', () => {
    const errors = Array.from({ length: 256 }, (_, value) => aimError(value, 0));
    expect(Math.min(...errors)).toBe(-16);
    expect(Math.max(...errors)).toBe(15);
  });

  it('is -7..+8 from 35,000 points', () => {
    const errors = Array.from({ length: 256 }, (_, value) => aimError(value, 35000));
    expect(Math.min(...errors)).toBe(-7);
    expect(Math.max(...errors)).toBe(8);
  });
});
