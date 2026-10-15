import { describe, expect, it } from 'vitest';
import { newSlot, poseFor, spritePosition, stepPosition } from './flight-slot';

describe('poseFor', () => {
  it('uses the upright drawing near vertical', () => {
    expect(poseFor(0x100)).toEqual({ tile: 6, flipX: false, flipY: false });
    expect(poseFor(0x300)).toEqual({ tile: 6, flipX: true, flipY: true });
  });

  it('uses the horizontal drawing, mirrored, pointing right', () => {
    expect(poseFor(0x000)).toEqual({ tile: 0, flipX: true, flipY: false });
    expect(poseFor(0x200).tile).toBe(0);
  });

  it('turns through the six drawings of a quarter', () => {
    const tiles = [0x00, 0x30, 0x60, 0x90, 0xc0, 0xe0].map((angle) => poseFor(angle).tile);
    expect(tiles).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe('stepPosition', () => {
  it('moves the whole speed along the main axis', () => {
    expect(stepPosition({ x: 0x4000, y: 0x4000 }, 0x000, 2)).toEqual({ x: 0x4100, y: 0x4000 });
    expect(stepPosition({ x: 0x4000, y: 0x4000 }, 0x300, 3)).toEqual({ x: 0x4000, y: 0x3e80 });
  });

  it('moves almost equally on both axes along a diagonal', () => {
    const moved = stepPosition({ x: 0x4000, y: 0x4000 }, 0x080, 2);
    expect(moved.y - 0x4000).toBe(256);
    expect(moved.x - 0x4000).toBe(254);
  });

  it('does not move at speed 0', () => {
    expect(stepPosition({ x: 1, y: 2 }, 0x123, 0)).toEqual({ x: 1, y: 2 });
  });
});

describe('spritePosition', () => {
  it('turns flight coordinates into sprite registers', () => {
    // y = 312 is the top of the screen: sprite y 41, just below the score lines' 40.
    expect(spritePosition(newSlot({ object: 8, y: 312 << 7, x: 100 << 7 }))).toEqual({
      x: 100,
      y: 41,
    });
  });

  it('adds the frozen formation offset while heading home', () => {
    const slot = newSlot({ object: 8, y: 300 << 7, x: 100 << 7, homing: true, offsetX: 0xfe });
    expect(spritePosition(slot).x).toBe(98);
  });
});
