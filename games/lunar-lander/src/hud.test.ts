import { describe, expect, it } from 'vitest';
import { arrowLines, hudLines, sixPlaces, zeroPadded } from './hud';

describe('the instruments', () => {
  it('writes score, time and fuel with their leading zeros', () => {
    expect(zeroPadded(50, 4)).toBe('0050');
    expect(zeroPadded(7, 2)).toBe('07');
  });

  it('right-aligns altitude and speeds in six places', () => {
    expect(sixPlaces(200)).toBe('   200');
    expect(sixPlaces(0)).toBe('     0');
  });

  it('draws an arrow for each speed the instruments show', () => {
    expect(arrowLines(0, 0)).toEqual([]);
    expect(arrowLines(63, -63)).toEqual([]);
    expect(arrowLines(0x3200, 0).length).toBeGreaterThan(0);
    expect(arrowLines(0x3200, -0x100).length).toBe(2 * arrowLines(0x3200, 0).length);
  });

  it('draws everything at the top of the screen', () => {
    const lines = hudLines({ score: 0, seconds: 75, fuel: 750, altitude: 2696, vx: 0x3200, vy: 0 });
    expect(Math.min(...lines.map((line) => Math.min(line.y1, line.y2)))).toBeGreaterThan(680);
  });
});
