import { describe, expect, it } from 'vitest';
import { saucerLines } from './render-saucer';
import type { Saucer } from './saucer';

const SAUCER: Saucer = {
  kind: 'saucer',
  position: { x: 4096, y: 3072 },
  vx: 16,
  vy: 0,
  size: 'large',
};

/** Horizontal extent of a set of lines. */
const width = (lines: readonly { readonly x1: number; readonly x2: number }[]): number => {
  const xs = lines.flatMap((line) => [line.x1, line.x2]);
  return Math.max(...xs) - Math.min(...xs);
};

describe('saucerLines', () => {
  it('draws the large saucer 40 units wide and the small one 20', () => {
    expect(width(saucerLines(SAUCER))).toBeCloseTo(40, 0);
    expect(width(saucerLines({ ...SAUCER, size: 'small' }))).toBeCloseTo(20, 0);
  });

  it('draws the explosion as a cloud of dots, and nothing for a free slot', () => {
    const cloud = saucerLines({ kind: 'explosion', position: SAUCER.position, status: 0xf0 });
    expect(cloud.every((line) => line.x1 === line.x2)).toBe(true);
    expect(saucerLines(null)).toEqual([]);
  });
});
