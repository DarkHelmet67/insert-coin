import { describe, expect, it } from 'vitest';
import { altitudeOf, clearance, hitsSurface, isTouchingDown, probesAt } from './collision';

describe('the distance from the surface', () => {
  it('uses the feet of the upright module in the close-up', () => {
    const probes = probesAt(2600, 100, 8, 'minor');
    expect(probes.lowerLeft).toEqual([2591, 82]);
    expect(probes.lowerRight).toEqual([2612, 82]);
    expect(altitudeOf(probes)).toBe(18);
  });

  it('uses the position of the small module in the whole view', () => {
    const probes = probesAt(2600, 100, 8, 'major');
    expect(probes.lowerLeft).toEqual([2600, 100]);
    expect(clearance(probes.lowerLeft)).toBe(36);
  });

  it('touches down when both feet are within 2 units of the surface', () => {
    expect(isTouchingDown(probesAt(2600, 64 + 18 + 1, 8, 'minor'))).toBe(true);
    expect(isTouchingDown(probesAt(2600, 64 + 18 + 2, 8, 'minor'))).toBe(false);
  });

  it('crashes when a point goes into the surface', () => {
    expect(hitsSurface(probesAt(2600, 64 + 17, 8, 'minor'))).toBe(true);
    expect(hitsSurface(probesAt(2600, 64 + 18, 8, 'minor'))).toBe(false);
    expect(altitudeOf(probesAt(2600, 64 + 17, 8, 'minor'))).toBe(0);
  });
});
