import { describe, expect, it } from 'vitest';
import { syncScreen } from './screen';

const VIEWPORT = { left: 0, bottom: 0, width: 400, height: 300 };

describe('syncScreen', () => {
  it('gives the canvas the pixels it has on screen, times the pixel ratio', () => {
    const ctx = { canvas: { width: 300, height: 150, clientWidth: 400, clientHeight: 300 } };
    const mapping = syncScreen(ctx, VIEWPORT, 2);
    expect(ctx.canvas).toMatchObject({ width: 800, height: 600 });
    expect(mapping.scale).toBe(2);
  });

  it('leaves a hidden canvas alone', () => {
    const ctx = { canvas: { width: 300, height: 150, clientWidth: 0, clientHeight: 0 } };
    syncScreen(ctx, VIEWPORT, 2);
    expect(ctx.canvas).toMatchObject({ width: 300, height: 150 });
  });
});
