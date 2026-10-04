import { describe, expect, it } from 'vitest';
import { atariVectorFont, textToLines, vectorTextWidth } from './font';
import { shapeEnd } from './shape';

describe('atariVectorFont', () => {
  it('has the letters, the digits, the space and the ©', () => {
    const chars = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ©'];
    expect(chars.filter((char) => !atariVectorFont.glyphs.has(char))).toEqual([]);
  });

  it('ends every glyph where the next one begins, 12 units to the right', () => {
    const ends = [...atariVectorFont.glyphs.entries()]
      .filter(([char]) => char !== '©')
      .map(([char, glyph]) => [char, shapeEnd(glyph)]);
    expect(ends.filter(([, end]) => JSON.stringify(end) !== '{"dx":12,"dy":0}')).toEqual([]);
  });

  it('draws the © wider, on the same baseline', () => {
    expect(shapeEnd(atariVectorFont.glyphs.get('©') ?? [])).toEqual({ dx: 16, dy: 0 });
  });
});

describe('text', () => {
  it('measures from the first glyph to the end of the last one', () => {
    expect(vectorTextWidth(atariVectorFont, '1979')).toBe(4 * 12 - 4);
    expect(vectorTextWidth(atariVectorFont, '')).toBe(0);
  });

  it('writes lowercase as uppercase and scales the glyphs', () => {
    const lower = textToLines(atariVectorFont, 'l', { x: 0, y: 0, scale: 2 });
    // The L of the ROM: a blank move up, then down 12 and right 8.
    expect(lower).toEqual([
      { x1: 0, y1: 24, x2: 0, y2: 0, brightness: 7 },
      { x1: 0, y1: 0, x2: 16, y2: 0, brightness: 7 },
    ]);
  });

  it('leaves a blank space for unknown characters', () => {
    expect(textToLines(atariVectorFont, '?', { x: 0, y: 0 })).toEqual([]);
    expect(vectorTextWidth(atariVectorFont, 'A?')).toBe(20);
  });

  it('draws every stroke at the requested brightness', () => {
    const lines = textToLines(atariVectorFont, 'L', { x: 0, y: 0, brightness: 12 });
    expect(lines.map((line) => line.brightness)).toEqual([12, 12]);
  });
});
