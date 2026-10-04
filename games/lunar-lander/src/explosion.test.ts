import { describe, expect, it } from 'vitest';
import { explosionFor, explosionLines, explosionVolume } from './explosion';

describe('the explosion', () => {
  it('throws the cabin up and back from the motion', () => {
    expect(explosionFor(0x1000, -0x2000, 0)).toEqual({ set: 0, cabinX: -4, cabinY: 4 });
    expect(explosionFor(-0x1000, -0x8000, 0b1100)).toEqual({ set: 3, cabinX: 4, cabinY: 7 });
  });

  it('spreads out as the steps go by', () => {
    const explosion = explosionFor(0, -0x1000, 0);
    /** Horizontal extent of the debris at `step`. */
    const width = (step: number): number => {
      const xs = explosionLines(explosion, step, 512, 400).flatMap((line) => [line.x1, line.x2]);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(width(40)).toBeGreaterThan(width(5));
  });

  it('loses its pieces one by one, the cabin last', () => {
    const explosion = explosionFor(0, 0, 0);
    expect(explosionLines(explosion, 0x7e, 512, 400).length).toBeGreaterThan(0);
    expect(explosionLines(explosion, 0x80, 512, 400)).toEqual([]);
  });

  it('is loud at first and silent from step 64', () => {
    expect(explosionVolume(1)).toBe(15);
    expect(explosionVolume(63)).toBe(8);
    expect(explosionVolume(64)).toBe(0);
  });
});
