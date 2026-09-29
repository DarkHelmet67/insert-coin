import { describe, expect, it } from 'vitest';
import { paletteFor, toggleColorMode } from './palette';

describe('palette', () => {
  it('has the five film strips only in color mode', () => {
    expect(paletteFor('color').strips).toHaveLength(5);
    expect(paletteFor('mono').strips).toEqual([]);
  });

  it('covers two brick rows with each of the four brick strips, red on top', () => {
    const [red, , , yellow] = paletteFor('color').strips;
    expect(red).toMatchObject({ top: 40, height: 8, color: '#f00032' });
    expect(yellow).toMatchObject({ top: 64, height: 8 });
  });

  it('switches between the two modes', () => {
    expect(toggleColorMode('mono')).toBe('color');
    expect(toggleColorMode('color')).toBe('mono');
  });
});
