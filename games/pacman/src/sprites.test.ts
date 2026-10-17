import { describe, expect, it } from 'vitest';
import { spriteScreenPosition } from './sprites';

describe('spriteScreenPosition', () => {
  it('draws Pac-Man at his start straddling columns 13 and 14 of row 26', () => {
    const corner = spriteScreenPosition({ x: 0x80, y: 0xc4 });
    expect(corner).toEqual({ x: 104, y: 204 });
    expect(Math.floor((corner.y + 8) / 8)).toBe(26);
    // Centered on a tile: x $84 is the middle of column 13 (pixels 104-111).
    expect(spriteScreenPosition({ x: 0x84, y: 0xc4 }).x + 8).toBe(108);
  });
});
