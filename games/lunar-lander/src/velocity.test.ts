import { describe, expect, it } from 'vitest';
import { addSpeed, applyFriction, MAX_SPEED, shownSpeed } from './velocity';

describe('speeds', () => {
  it('saturates instead of wrapping around', () => {
    expect(addSpeed(MAX_SPEED - 1, 10)).toBe(MAX_SPEED);
    expect(addSpeed(-MAX_SPEED + 1, -10)).toBe(-MAX_SPEED);
    expect(addSpeed(5, -10)).toBe(-5);
  });

  it('shows the top 10 bits of the magnitude: the starting 0x3200 is 200', () => {
    expect(shownSpeed(0x3200)).toBe(200);
    expect(shownSpeed(-0x3200)).toBe(200);
    expect(shownSpeed(63)).toBe(0);
  });

  it('loses 1/32 of the magnitude to friction, rounded down', () => {
    expect(applyFriction(3200)).toBe(3100);
    expect(applyFriction(-3200)).toBe(-3100);
    expect(applyFriction(31)).toBe(31);
    expect(applyFriction(0)).toBe(0);
  });
});
