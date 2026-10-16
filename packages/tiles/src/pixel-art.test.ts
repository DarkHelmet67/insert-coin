import { isPixelOn } from '@arcade/render';
import { describe, expect, it } from 'vitest';
import { flipArt, joinArt, parseArt } from './pixel-art';

describe('parseArt', () => {
  it('puts each color value in its own layer and leaves "." transparent', () => {
    const art = parseArt(['1.', '23']);
    expect(art.width).toBe(2);
    expect(art.height).toBe(2);
    const [one, two, three] = art.layers;
    expect(isPixelOn(one, 0, 0)).toBe(true);
    expect(isPixelOn(one, 1, 0)).toBe(false);
    expect(isPixelOn(two, 0, 1)).toBe(true);
    expect(isPixelOn(three, 1, 1)).toBe(true);
    expect(isPixelOn(three, 0, 1)).toBe(false);
  });
});

describe('flipArt', () => {
  it('mirrors left-right and top-bottom', () => {
    expect(flipArt(['12', '3.'], { x: true, y: false })).toEqual(['21', '.3']);
    expect(flipArt(['12', '3.'], { x: false, y: true })).toEqual(['3.', '12']);
    expect(flipArt(['12', '3.'], { x: true, y: true })).toEqual(['.3', '21']);
  });
});

describe('joinArt', () => {
  it('joins four tiles into a picture twice as wide and tall', () => {
    expect(joinArt(['1'], ['2'], ['3'], ['.'])).toEqual(['12', '3.']);
  });
});
