import { describe, expect, it } from 'vitest';
import { isPixelOn, parseSprite, spriteRuns } from './sprite';

describe('parseSprite', () => {
  it('reads size and lit pixels from sprite art', () => {
    const sprite = parseSprite(['.X.', 'XXX']);
    expect(sprite.width).toBe(3);
    expect(sprite.height).toBe(2);
    expect(isPixelOn(sprite, 1, 0)).toBe(true);
    expect(isPixelOn(sprite, 0, 0)).toBe(false);
  });

  it('rejects rows of different lengths', () => {
    expect(() => parseSprite(['XX', 'X'])).toThrow('2 characters');
  });

  it('treats pixels outside the sprite as off', () => {
    const sprite = parseSprite(['X']);
    expect(isPixelOn(sprite, -1, 0)).toBe(false);
    expect(isPixelOn(sprite, 1, 0)).toBe(false);
  });
});

describe('spriteRuns', () => {
  it('merges consecutive lit pixels of a row into one run', () => {
    expect(spriteRuns(parseSprite(['XX.XXX']))).toEqual([
      { x: 0, y: 0, length: 2 },
      { x: 3, y: 0, length: 3 },
    ]);
  });

  it('lists runs row by row', () => {
    expect(spriteRuns(parseSprite(['.X', 'X.']))).toEqual([
      { x: 1, y: 0, length: 1 },
      { x: 0, y: 1, length: 1 },
    ]);
  });

  it('has no runs for an empty sprite', () => {
    expect(spriteRuns(parseSprite(['...']))).toEqual([]);
  });
});
