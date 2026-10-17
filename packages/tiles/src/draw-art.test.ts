import type { DrawingContext } from '@arcade/render';
import { describe, expect, it } from 'vitest';
import { drawArt } from './draw-art';
import { parseArt } from './pixel-art';

/** A fake context that records the color of each rectangle drawn. */
const recordingContext = (): DrawingContext & { readonly colors: string[] } => {
  const colors: string[] = [];
  const ctx = {
    canvas: { width: 8, height: 8 },
    fillStyle: '' as DrawingContext['fillStyle'],
    colors,
    fillRect: () => {
      colors.push(String(ctx.fillStyle));
    },
  };
  return ctx;
};

describe('drawArt', () => {
  it('draws each layer in its color and skips the transparent ones', () => {
    const ctx = recordingContext();
    drawArt(ctx, parseArt(['12', '3.']), 0, 0, ['#f00', undefined, '#00f']);
    expect(ctx.colors).toEqual(['#f00', '#00f']);
  });
});
