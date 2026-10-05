import { describe, expect, it } from 'vitest';
import { addSpeed, applyFriction, MAX_SPEED, scaleSpeed, shownSpeed } from './velocity';

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

describe('scaleSpeed', () => {
  it('gives the program value back with a multiplier of 1', () => {
    expect(scaleSpeed(0x11, 1)).toBe(17);
    expect(scaleSpeed(-27, 1)).toBe(-27);
  });

  it('rounds to whole speed units', () => {
    expect(scaleSpeed(27, 1.5)).toBe(41); // 40.5 rounds up
    expect(scaleSpeed(17, 0.8)).toBe(14); // 13.6
  });
});
