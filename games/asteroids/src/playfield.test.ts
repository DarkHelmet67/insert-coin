import { describe, expect, it } from 'vitest';
import { SCREEN_BOTTOM, SCREEN_HEIGHT, toCanvasY } from './playfield';

describe('toCanvasY', () => {
  it('puts the bottom of the DVG screen at the bottom of the canvas', () => {
    expect(toCanvasY(SCREEN_BOTTOM)).toBe(SCREEN_HEIGHT);
  });

  it('puts the top of the DVG screen at the top of the canvas', () => {
    expect(toCanvasY(SCREEN_BOTTOM + SCREEN_HEIGHT)).toBe(0);
  });
});
