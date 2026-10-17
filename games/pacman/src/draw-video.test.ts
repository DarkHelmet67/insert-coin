import type { DrawingContext } from '@arcade/render';
import { describe, expect, it } from 'vitest';
import { drawVideo } from './draw-video';
import { filledVideo, writeVideo } from './video';

/** A fake context that counts the black squares drawn under each cell. */
const countingContext = (): DrawingContext & { readonly cells: () => number } => {
  const calls: string[] = [];
  const ctx = {
    canvas: { width: 224, height: 288 },
    fillStyle: '' as DrawingContext['fillStyle'],
    fillRect: (_x: number, _y: number, width: number) => {
      if (width === 8 && ctx.fillStyle === '#000') calls.push('cell');
    },
    cells: () => calls.length,
  };
  return ctx;
};

describe('drawVideo', () => {
  it('draws every cell the first time', () => {
    const ctx = countingContext();
    drawVideo(ctx, filledVideo(0x40, 0));
    expect(ctx.cells()).toBe(28 * 36);
  });

  it('redraws only the changed cells', () => {
    const ctx = countingContext();
    const before = filledVideo(0x40, 0);
    drawVideo(ctx, writeVideo(before, { tiles: [{ address: 0x50, value: 0x10 }] }), before);
    expect(ctx.cells()).toBe(1);
  });
});
