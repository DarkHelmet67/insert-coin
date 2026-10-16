import { describe, expect, it } from 'vitest';
import { spriteScreenPosition } from './sprites';

describe('spriteScreenPosition', () => {
  it('draws Pac-Man at his start straddling columns 13 and 14 of row 26', () => {
    const corner = spriteScreenPosition({ x: 0x80, y: 0xc4 });
    expect(corner).toEqual({ x: 105, y: 204 });
    expect(Math.floor((corner.y + 8) / 8)).toBe(26);
  });
});
