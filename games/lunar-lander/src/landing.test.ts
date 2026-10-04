import { describe, expect, it } from 'vitest';
import { burnFuel, tankWith } from './fuel';
import { fuelPenalty, judgeLanding, landingPoints } from './landing';

describe('the landing verdict', () => {
  it('is good below 16 on both instruments, upright or one step off', () => {
    expect(judgeLanding(8, 0x3ff, -0x3ff)).toBe('good');
    expect(judgeLanding(7, 0, -0x100)).toBe('good');
    expect(judgeLanding(9, -0x200, 0)).toBe('good');
  });

  it('is hard falling at 16 to 31', () => {
    expect(judgeLanding(8, 0, -0x400)).toBe('hard');
    expect(judgeLanding(8, 0, -0x7ff)).toBe('hard');
  });

  it('is a crash falling faster, sliding, or tilted', () => {
    expect(judgeLanding(8, 0, -0x800)).toBe('crash');
    expect(judgeLanding(8, 0x400, 0)).toBe('crash');
    expect(judgeLanding(10, 0, 0)).toBe('crash');
    expect(judgeLanding(6, 0, 0)).toBe('crash');
  });
});

describe('points and fuel', () => {
  it('gives 50, 15 or 5 points times the site multiplier', () => {
    expect(landingPoints('good', 5)).toBe(250);
    expect(landingPoints('hard', 2)).toBe(30);
    expect(landingPoints('crash', 1)).toBe(5);
  });

  it('charges whoever burned less than 8 units a second', () => {
    expect(fuelPenalty(30, tankWith(750))).toBe(240);
    expect(fuelPenalty(30, burnFuel(tankWith(750), 100 * 100))).toBe(140);
    expect(fuelPenalty(30, burnFuel(tankWith(750), 300 * 100))).toBe(0);
  });
});
