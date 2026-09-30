import { describe, expect, it } from 'vitest';
import { collides, halfDistance, TARGET_SIZE } from './collisions';

describe('halfDistance', () => {
  it('halves the distance, one less going backwards', () => {
    expect(halfDistance(100, 140)).toBe(20);
    expect(halfDistance(140, 100)).toBe(19);
  });

  it('gives up beyond 511 units', () => {
    expect(halfDistance(0, 511)).toBe(255);
    expect(halfDistance(0, 512)).toBeUndefined();
    // Going backwards the ROM accepts one unit more: -512 still gives 255.
    expect(halfDistance(512, 0)).toBe(255);
    expect(halfDistance(513, 0)).toBeUndefined();
  });
});

describe('collides', () => {
  const rock = { x: 4000, y: 3000 };

  it('hits a large rock from 264 units away along an axis', () => {
    expect(collides(rock, { x: 4000 - 264, y: 3000 }, TARGET_SIZE[4])).toBe(true);
    expect(collides(rock, { x: 4000 - 266, y: 3000 }, TARGET_SIZE[4])).toBe(false);
  });

  it('cuts the corners of the square: an octagon', () => {
    expect(collides(rock, { x: 4000 + 240, y: 3000 + 240 }, TARGET_SIZE[4])).toBe(false);
    expect(collides(rock, { x: 4000 + 180, y: 3000 + 180 }, TARGET_SIZE[4])).toBe(true);
  });

  it('ignores the wrap-around of the playfield', () => {
    expect(collides({ x: 2, y: 3000 }, { x: 8190, y: 3000 }, TARGET_SIZE[4])).toBe(false);
  });
});
