import { describe, expect, it } from 'vitest';
import { bitmapsOverlap, boundsOf, eraseBitmap, isSolidAt, type Bitmap } from './bitmap';

/** Builds a bitmap from rows of `X` (solid) and `.` (empty), like sprite art. */
const bitmap = (rows: readonly string[]): Bitmap => ({
  width: rows[0]?.length ?? 0,
  height: rows.length,
  pixels: rows.flatMap((row) => [...row].map((char) => char === 'X')),
});

/** A 3×3 ring: solid border, empty center. */
const ring = bitmap(['XXX', 'X.X', 'XXX']);
const dot = bitmap(['X']);

describe('boundsOf', () => {
  it('rounds the position like drawing does', () => {
    expect(boundsOf({ bitmap: ring, x: 4.6, y: 2.2 })).toEqual({ x: 5, y: 2, width: 3, height: 3 });
  });
});

describe('bitmapsOverlap', () => {
  it('detects solid pixels in the same place', () => {
    expect(bitmapsOverlap({ bitmap: ring, x: 0, y: 0 }, { bitmap: dot, x: 1, y: 0 })).toBe(true);
  });

  it('ignores a dot in an empty area inside the bounding box', () => {
    // The rectangles overlap, but the dot sits in the hole of the ring: no real contact.
    expect(bitmapsOverlap({ bitmap: ring, x: 0, y: 0 }, { bitmap: dot, x: 1, y: 1 })).toBe(false);
  });

  it('is false when the bounding boxes do not overlap', () => {
    expect(bitmapsOverlap({ bitmap: ring, x: 0, y: 0 }, { bitmap: dot, x: 3, y: 0 })).toBe(false);
  });

  it('is symmetric', () => {
    const a = { bitmap: ring, x: 0, y: 0 };
    const b = { bitmap: dot, x: 2, y: 2 };
    expect(bitmapsOverlap(a, b)).toBe(bitmapsOverlap(b, a));
  });
});

describe('isSolidAt', () => {
  it('treats positions outside the bitmap as empty instead of wrapping to the next row', () => {
    const line = { bitmap: bitmap(['X..', '..X']), x: 0, y: 0 };
    expect(isSolidAt(line, 3, 0)).toBe(false);
  });
});

describe('eraseBitmap', () => {
  it('switches off the pixels covered by the brush', () => {
    const erased = eraseBitmap({ bitmap: ring, x: 10, y: 10 }, { bitmap: dot, x: 11, y: 10 });
    expect(erased.pixels).toEqual(bitmap(['X.X', 'X.X', 'XXX']).pixels);
  });

  it('leaves the bitmap untouched when the brush is elsewhere', () => {
    const erased = eraseBitmap({ bitmap: ring, x: 0, y: 0 }, { bitmap: dot, x: 50, y: 50 });
    expect(erased.pixels).toEqual(ring.pixels);
  });
});
