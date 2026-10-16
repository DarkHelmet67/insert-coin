import { describe, expect, it } from 'vitest';
import { paletteColors } from './palette';

describe('paletteColors', () => {
  it('colors Blinky (palette 1) red with white and blue eyes', () => {
    const [eyes, pupils, body] = paletteColors(1);
    expect(body).toBe('#ff0000');
    expect(eyes).toBe('#dedeff');
    expect(pupils).toBe('#2121ff');
  });

  it('gives Pac-Man (palette 9) his yellow', () => {
    expect(paletteColors(9)[2]).toBe('#ffff00');
  });

  it('draws nothing in palette 0, the hidden sprite', () => {
    expect(paletteColors(0)).toEqual([undefined, undefined, undefined]);
  });
});
