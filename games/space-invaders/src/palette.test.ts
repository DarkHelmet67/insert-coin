import { describe, expect, it } from 'vitest';
import { colorConfig } from './colors.config';
import { alienColor, paletteFor, toggleColorMode } from './palette';

describe('palette', () => {
  it('uses the configured colors in color mode', () => {
    const palette = paletteFor('color');
    expect(palette.cannon).toBe(colorConfig.cannon);
    expect(alienColor(palette, 1)).toBe(colorConfig.alienRows[0]);
    expect(alienColor(palette, 5)).toBe(colorConfig.alienRows[4]);
  });

  it('draws everything in one color in mono mode', () => {
    const palette = paletteFor('mono');
    expect(new Set([palette.text, palette.cannon, palette.ufo, alienColor(palette, 1)])).toEqual(
      new Set([colorConfig.mono]),
    );
    expect(palette.background).toBe(colorConfig.background);
  });

  it('switches between the two modes', () => {
    expect(toggleColorMode('mono')).toBe('color');
    expect(toggleColorMode('color')).toBe('mono');
  });
});
