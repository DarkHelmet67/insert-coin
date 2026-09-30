import { describe, expect, it } from 'vitest';
import { debrisCount, debrisLines, debrisOffset } from './render-debris';

describe('debrisCount', () => {
  it('shows six pieces at first, then one fewer every 16 steps of the status', () => {
    expect([0xa0, 0xaf, 0xb0, 0xc0, 0xd0, 0xe0, 0xf0, 0xff].map(debrisCount)).toEqual([
      6, 6, 5, 4, 3, 2, 1, 1,
    ]);
  });
});

describe('debrisOffset', () => {
  it('starts a sixteenth of the velocity away, rounded down, and moves with it', () => {
    expect(debrisOffset(-40, 0)).toBe(-3);
    expect(debrisOffset(50, 0)).toBe(3);
    expect(debrisOffset(64, 4)).toBe(5);
  });
});

describe('debrisLines', () => {
  it('draws one line per visible piece', () => {
    expect(debrisLines({ x: 4096, y: 3072 }, 0xa0, 0)).toHaveLength(6);
    expect(debrisLines({ x: 4096, y: 3072 }, 0xf8, 180)).toHaveLength(1);
  });
});
