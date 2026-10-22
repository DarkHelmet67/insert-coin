import { drawSprite, parseSprite } from '@arcade/render';
import { describe, expect, it } from 'vitest';
import { createDrawingRecorder, isBetweenRows, rectsToVoxels, spriteVoxels } from './index';

describe('createDrawingRecorder', () => {
  it('records every filled rectangle with its color', () => {
    const recorder = createDrawingRecorder(224, 256);
    recorder.ctx.fillStyle = '#f00';
    recorder.ctx.fillRect(1, 2, 3, 4);
    expect(recorder.take()).toEqual([{ x: 1, y: 2, width: 3, height: 4, color: '#f00' }]);
  });

  it('starts a new recording after each take', () => {
    const recorder = createDrawingRecorder(10, 10);
    recorder.ctx.fillRect(0, 0, 1, 1);
    recorder.take();
    expect(recorder.take()).toEqual([]);
  });

  it('exposes the size of the original screen to the drawing code', () => {
    expect(createDrawingRecorder(224, 256).ctx.canvas).toEqual({ width: 224, height: 256 });
  });

  it('records what the shared drawing helpers draw', () => {
    const recorder = createDrawingRecorder(10, 10);
    drawSprite(recorder.ctx, parseSprite(['XX.', '..X']), 4, 5, '#0f0');
    expect(rectsToVoxels(recorder.take(), '#000')).toEqual([
      { x: 4, y: 5, color: '#0f0' },
      { x: 5, y: 5, color: '#0f0' },
      { x: 6, y: 6, color: '#0f0' },
    ]);
  });
});

describe('rectsToVoxels', () => {
  it('splits a rectangle into one voxel per pixel', () => {
    const voxels = rectsToVoxels([{ x: 0, y: 0, width: 2, height: 2, color: '#fff' }], '#000');
    expect(voxels).toHaveLength(4);
  });

  it('skips the rectangles that clear the screen', () => {
    const rects = [
      { x: 0, y: 0, width: 224, height: 256, color: '#000' },
      { x: 3, y: 3, width: 1, height: 1, color: '#fff' },
    ];
    expect(rectsToVoxels(rects, '#000')).toEqual([{ x: 3, y: 3, color: '#fff' }]);
  });

  it('rounds positions to whole pixels, like drawing on a canvas', () => {
    expect(rectsToVoxels([{ x: 2.4, y: 7.6, width: 1, height: 1, color: '#fff' }], '#000')).toEqual(
      [{ x: 2, y: 8, color: '#fff' }],
    );
  });
});

describe('spriteVoxels', () => {
  it('places one voxel on each lit pixel of the sprite', () => {
    expect(spriteVoxels(parseSprite(['X.', '.X']), 10, 20, '#abc')).toEqual([
      { x: 10, y: 20, color: '#abc' },
      { x: 11, y: 21, color: '#abc' },
    ]);
  });
});

describe('isBetweenRows', () => {
  it('includes the top row and excludes the bottom one', () => {
    expect(isBetweenRows({ x: 0, y: 5, color: '' }, 5, 8)).toBe(true);
    expect(isBetweenRows({ x: 0, y: 8, color: '' }, 5, 8)).toBe(false);
  });
});
