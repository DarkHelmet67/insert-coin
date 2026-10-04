import { describe, expect, it } from 'vitest';
import { drawingEnd, flameBrightness, flameLength, flameShape, moduleLines } from './flame';
import { ABORT_THRUST } from './thrust';

describe('the flame', () => {
  it('starts at the left corner of the bell of the upright module', () => {
    expect(drawingEnd('large', 8)).toEqual({ dx: -6, dy: -16 });
    expect(drawingEnd('small', 8)).toEqual({ dx: -3, dy: -8 });
  });

  it('grows with the thrust and flickers by one on odd frames', () => {
    expect(flameLength(0, 0)).toBe(0);
    expect(flameLength(15, 0)).toBe(6);
    expect(flameLength(15, 1)).toBe(7);
    expect(flameLength(ABORT_THRUST, 0)).toBe(7);
  });

  it('is brighter with more thrust, at the maximum for the ABORT', () => {
    expect(flameBrightness(1)).toBe(8);
    expect(flameBrightness(15)).toBe(15);
    expect(flameBrightness(ABORT_THRUST)).toBe(15);
  });

  it('points down under the upright module', () => {
    // Base (-6,-16) to (8,-16): tip 7 * 3 = 21 below the middle.
    expect(flameShape('large', 8, 3, 9)).toEqual([
      [7, -21, 9],
      [7, 21, 9],
    ]);
  });

  it('has no flame without thrust', () => {
    const still = moduleLines({ x: 0, y: 0, size: 'large', orientation: 8, thrust: 0, frame: 0 });
    const firing = moduleLines({ x: 0, y: 0, size: 'large', orientation: 8, thrust: 9, frame: 0 });
    expect(firing).toHaveLength(still.length + 2);
  });
});
