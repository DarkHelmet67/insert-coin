import { describe, expect, it } from 'vitest';
import { surfaceHeight, surfaceLines, WORLD_WIDTH, wrapX } from './surface';
import { SURFACE } from './surface-data';

describe('the lunar surface', () => {
  it('starts and ends at the same height, so it can wrap around', () => {
    expect(SURFACE[0]).toEqual([0, 896]);
    expect(SURFACE[SURFACE.length - 1]).toEqual([WORLD_WIDTH, 896]);
  });

  it('starts each 256-unit section at the height of the ROM table', () => {
    const starts = [896, 384, 656, 576, 224, 368, 864, 1440, 1088, 640, 64, 64, 448, 96, 64, 640];
    starts.forEach((height, section) => {
      expect(surfaceHeight(section * 256)).toBe(height);
    });
  });

  it('never goes back on itself: x only grows', () => {
    SURFACE.slice(1).forEach(([x], i) => {
      expect(x).toBeGreaterThanOrEqual(SURFACE[i]?.[0] ?? 0);
    });
  });

  it('repeats every 4096 units', () => {
    expect(wrapX(-1)).toBe(4095);
    expect(surfaceHeight(100 + WORLD_WIDTH)).toBe(surfaceHeight(100));
  });

  it('is interpolated between two points', () => {
    expect(surfaceHeight(16)).toBe(896);
    expect(surfaceHeight(36)).toBe(880);
  });

  it('fills the screen in the whole view, wherever the camera is', () => {
    const lines = surfaceLines({ zoom: 4, left: 300, bottom: 8 });
    expect(Math.min(...lines.map((line) => Math.min(line.x1, line.x2)))).toBeLessThanOrEqual(0);
    expect(Math.max(...lines.map((line) => Math.max(line.x1, line.x2)))).toBeGreaterThanOrEqual(
      1023,
    );
  });

  it('draws only the lines near the screen in the close-up', () => {
    const lines = surfaceLines({ zoom: 1, left: -2000, bottom: 0 });
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.length).toBeLessThan(SURFACE.length / 2);
  });
});
