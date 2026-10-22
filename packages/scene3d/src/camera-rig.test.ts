import { describe, expect, it } from 'vitest';
import { degreesToRadians, mapRange, orbitPosition, smoothTowards } from './camera-rig';

describe('mapRange', () => {
  it('maps a value from one range to another', () => {
    expect(mapRange(5, 0, 10, -1, 1)).toBe(0);
    expect(mapRange(10, 0, 10, -1, 1)).toBe(1);
  });

  it('clamps the values outside the range', () => {
    expect(mapRange(-5, 0, 10, -1, 1)).toBe(-1);
    expect(mapRange(50, 0, 10, -1, 1)).toBe(1);
  });

  it('returns the start of the output range when the input range is empty', () => {
    expect(mapRange(3, 2, 2, 7, 9)).toBe(7);
  });
});

describe('smoothTowards', () => {
  it('closes about 63% of the gap after 1 / rate seconds', () => {
    expect(smoothTowards(0, 100, 2, 0.5)).toBeCloseTo(63.2, 1);
  });

  it('gives the same result in one big step or in many small ones', () => {
    const many = Array.from({ length: 10 }).reduce<number>(
      (value) => smoothTowards(value, 1, 3, 0.01),
      0,
    );
    expect(many).toBeCloseTo(smoothTowards(0, 1, 3, 0.1));
  });

  it('stays put when no time has passed', () => {
    expect(smoothTowards(4, 10, 5, 0)).toBe(4);
  });
});

describe('orbitPosition', () => {
  it('stands in front of the origin with no yaw and no pitch', () => {
    const position = orbitPosition(0, 0, 10);
    expect(position.x).toBeCloseTo(0);
    expect(position.z).toBeCloseTo(10);
  });

  it('moves to the right with a positive yaw and up with a positive pitch', () => {
    expect(orbitPosition(degreesToRadians(90), 0, 10).x).toBeCloseTo(10);
    expect(orbitPosition(0, degreesToRadians(90), 10).y).toBeCloseTo(10);
  });
});
