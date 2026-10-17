import { describe, expect, it } from 'vitest';
import { drawRandom } from './random';

describe('drawRandom', () => {
  it('walks the program bytes from pointer 0: 1, 6, 31...', () => {
    const first = drawRandom(0);
    const second = drawRandom(first.seed);
    expect([first.seed, second.seed, drawRandom(second.seed).seed]).toEqual([1, 6, 31]);
  });

  it('reads the low bits of the program byte: $0001 holds $3E, $0006 holds $0B', () => {
    expect(drawRandom(0).bits).toBe(0x3e & 3);
    expect(drawRandom(1).bits).toBe(0x0b & 3);
  });

  it('stays within the first 8 KB of the program', () => {
    expect(drawRandom(0x1fff).seed).toBeLessThan(0x2000);
  });
});
