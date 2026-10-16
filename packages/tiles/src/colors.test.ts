import { describe, expect, it } from 'vitest';
import { lookupColors, promColor } from './colors';

describe('promColor', () => {
  it('decodes BBGGGRRR with the resistor weights', () => {
    expect(promColor(0x00)).toBe('#000000');
    expect(promColor(0xff)).toBe('#ffffff');
    expect(promColor(0x07)).toBe('#ff0000');
    expect(promColor(0x38)).toBe('#00ff00');
    expect(promColor(0xc0)).toBe('#0000ff');
  });
});

describe('lookupColors', () => {
  const table = { prom: [0, 1, 2, 3, 0, 3, 0, 1], colors: ['k', 'r', 'g', 'b'], transparent: 0 };

  it('maps pixel values 1-3 of a palette to their colors', () => {
    expect(lookupColors(table, 0)).toEqual(['r', 'g', 'b']);
  });

  it('leaves the entries on the transparent color undrawn', () => {
    expect(lookupColors(table, 1)).toEqual(['b', undefined, 'r']);
  });
});
