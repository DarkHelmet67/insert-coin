import { describe, expect, it } from 'vitest';
import { VIEWPORT } from './playfield';
import { demoLines } from './demo';

describe('demoLines', () => {
  it('draws everything inside what the monitor shows', () => {
    const lines = demoLines();
    const xs = lines.flatMap((line) => [line.x1, line.x2]);
    const ys = lines.flatMap((line) => [line.y1, line.y2]);
    expect(lines.length).toBeGreaterThan(300);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(VIEWPORT.left);
    expect(Math.max(...xs)).toBeLessThanOrEqual(VIEWPORT.left + VIEWPORT.width);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(VIEWPORT.bottom);
    expect(Math.max(...ys)).toBeLessThanOrEqual(VIEWPORT.bottom + VIEWPORT.height);
  });
});
