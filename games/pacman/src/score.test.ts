import { describe, expect, it } from 'vitest';
import { POINTS, pointsOf, SCORE_ADDRESS, scoreWrites } from './score';
import { cellAddress } from './video';

describe('pointsOf', () => {
  it('reads the points table: dots, energizers, ghosts, fruits', () => {
    expect(pointsOf(POINTS.dot)).toBe(10);
    expect(pointsOf(POINTS.energizer)).toBe(50);
    expect([2, 3, 4, 5].map(pointsOf)).toEqual([200, 400, 800, 1600]);
    expect([6, 7, 8, 9, 10, 11, 12, 13].map(pointsOf)).toEqual([
      100, 300, 500, 700, 1000, 2000, 3000, 5000,
    ]);
  });
});

describe('scoreWrites', () => {
  it('shows a new game as "00" in columns 5 and 6 of row 1', () => {
    const writes = scoreWrites(0, SCORE_ADDRESS);
    expect(writes.map((write) => write.value)).toEqual([0x40, 0x40, 0x40, 0x40, 0, 0]);
    expect(writes[5]?.address).toBe(cellAddress(6, 1));
    expect(writes[0]?.address).toBe(cellAddress(1, 1));
  });

  it('blanks only the leading zeros', () => {
    expect(scoreWrites(10_250, SCORE_ADDRESS).map((write) => write.value)).toEqual([
      0x40, 1, 0, 2, 5, 0,
    ]);
  });
});
