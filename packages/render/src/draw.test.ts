import { describe, expect, it } from 'vitest';
import { clearScreen, drawSprite } from './draw';
import { parseSprite } from './sprite';
import { createRecordingContext } from './test-context';

describe('clearScreen', () => {
  it('fills the whole screen', () => {
    const ctx = createRecordingContext(10, 20);
    clearScreen(ctx);
    expect(ctx.rects).toEqual([{ x: 0, y: 0, width: 10, height: 20, color: '#000' }]);
  });
});

describe('drawSprite', () => {
  it('draws one rectangle per run, offset by the position', () => {
    const ctx = createRecordingContext();
    drawSprite(ctx, parseSprite(['XX.X']), 10, 5, '#0f0');
    expect(ctx.rects).toEqual([
      { x: 10, y: 5, width: 2, height: 1, color: '#0f0' },
      { x: 13, y: 5, width: 1, height: 1, color: '#0f0' },
    ]);
  });

  it('rounds the position to whole pixels', () => {
    const ctx = createRecordingContext();
    drawSprite(ctx, parseSprite(['X']), 10.6, 4.2, '#fff');
    expect(ctx.rects[0]).toMatchObject({ x: 11, y: 4 });
  });
});
