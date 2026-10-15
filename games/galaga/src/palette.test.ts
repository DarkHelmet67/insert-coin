import { describe, expect, it } from 'vitest';
import { charColors, promColor, spriteColors } from './palette';

describe('promColor', () => {
  it('decodes BBGGGRRR with the resistor weights', () => {
    expect(promColor(0x00)).toBe('#000000');
    expect(promColor(0xff)).toBe('#ffffff');
    expect(promColor(0x07)).toBe('#ff0000');
    expect(promColor(0x38)).toBe('#00ff00');
    expect(promColor(0xc0)).toBe('#0000ff');
  });
});

describe('spriteColors', () => {
  it('gives the fighter (palette 9) its red, blue and white', () => {
    expect(spriteColors(9)).toEqual(['#ff0000', promColor(0xd8), promColor(0xf6)]);
  });
});

describe('charColors', () => {
  it('writes "FIGHTER CAPTURED" (palette 4) in red', () => {
    expect(charColors(4)[2]).toBe('#ff0000');
  });

  it('leaves the pixels on color 15 transparent', () => {
    expect(charColors(0x1b)).toEqual([undefined, undefined, '#ff0000']);
  });
});
