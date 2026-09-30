import { describe, expect, it } from 'vitest';
import {
  explosionScale,
  rockSlotLines,
  rocksLines,
  shotsLines,
  shrapnelPattern,
} from './render-rocks';
import type { Rock } from './rocks';

const rock: Rock = {
  kind: 'rock',
  position: { x: 4096, y: 2048 },
  vx: 8,
  vy: 8,
  size: 4,
  shape: 0,
};

/** Horizontal extent of a set of lines. */
const width = (lines: readonly { readonly x1: number; readonly x2: number }[]): number => {
  const xs = lines.flatMap((line) => [line.x1, line.x2]);
  return Math.max(...xs) - Math.min(...xs);
};

describe('explosionScale', () => {
  it('grows by powers of two from 1/32 to full size', () => {
    expect(explosionScale(0xa0)).toBe(1 / 32);
    expect(explosionScale(0xe5)).toBe(1 / 2);
    expect(explosionScale(0xff)).toBe(1);
  });
});

describe('shrapnelPattern', () => {
  it('reads bits 2-3 of the status', () => {
    expect([0xa0, 0xa4, 0xa8, 0xac, 0xb0].map(shrapnelPattern)).toEqual([0, 1, 2, 3, 0]);
  });
});

describe('rockSlotLines', () => {
  it('halves the outline at each smaller size', () => {
    const large = width(rockSlotLines(rock));
    expect(width(rockSlotLines({ ...rock, size: 2 }))).toBeCloseTo(large / 2);
    expect(width(rockSlotLines({ ...rock, size: 1 }))).toBeCloseTo(large / 4);
  });

  it('draws nothing for a free slot and dots for an explosion', () => {
    expect(rockSlotLines(null)).toEqual([]);
    const dots = rockSlotLines({ kind: 'explosion', position: rock.position, status: 0xf0 });
    expect(dots.length).toBeGreaterThan(0);
    expect(dots.every((line) => line.x1 === line.x2 && line.y1 === line.y2)).toBe(true);
  });

  it('draws the rock around its place on the screen', () => {
    const xs = rocksLines([rock]).flatMap((line) => [line.x1, line.x2]);
    expect(Math.min(...xs)).toBeLessThan(512);
    expect(Math.max(...xs)).toBeGreaterThan(512);
  });
});

describe('shotsLines', () => {
  it('draws one bright dot per shot', () => {
    const shot = { position: { x: 800, y: 1600 }, vx: 0, vy: 0, life: 10 };
    expect(shotsLines([null, shot, null, null])).toEqual([
      { x1: 100, y1: 328, x2: 100, y2: 328, brightness: 15 },
    ]);
  });
});
