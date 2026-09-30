import { describe, expect, it } from 'vitest';
import { fitViewport, toPixel } from './viewport';

/** The screen of Asteroids: 1024 × 768 units, starting at y = 128. */
const ASTEROIDS = { left: 0, bottom: 128, width: 1024, height: 768 };

describe('fitViewport', () => {
  it('fills a canvas of the same shape', () => {
    expect(fitViewport(ASTEROIDS, 2048, 1536)).toEqual({
      viewport: ASTEROIDS,
      scale: 2,
      offsetX: 0,
      offsetY: 0,
    });
  });

  it('centers the picture in a wider canvas', () => {
    const mapping = fitViewport(ASTEROIDS, 1200, 768);
    expect(mapping.scale).toBe(1);
    expect(mapping.offsetX).toBe(88);
  });
});

describe('toPixel', () => {
  const mapping = fitViewport(ASTEROIDS, 512, 384);

  it('puts the top-left corner of the world at the top-left of the canvas', () => {
    expect(toPixel(mapping, 0, 896)).toEqual({ px: 0, py: 0 });
  });

  it('puts the bottom of the world at the bottom of the canvas', () => {
    expect(toPixel(mapping, 1024, 128)).toEqual({ px: 512, py: 384 });
  });
});
