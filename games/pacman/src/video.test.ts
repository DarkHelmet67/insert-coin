import { describe, expect, it } from 'vitest';
import { cellAddress, fillCells, filledVideo, writeVideo } from './video';

describe('cellAddress', () => {
  it('finds the playfield corners the program uses', () => {
    expect(cellAddress(27, 2)).toBe(0x040);
    expect(cellAddress(0, 33)).toBe(0x3bf);
    // The energizers at the top left and bottom right.
    expect(cellAddress(1, 6)).toBe(0x384);
    expect(cellAddress(26, 26)).toBe(0x078);
  });

  it('finds the score rows', () => {
    // "HIGH SCORE" starts at $3D4, "CREDIT" at $03B.
    expect(cellAddress(9, 0)).toBe(0x3d4);
    expect(cellAddress(2, 35)).toBe(0x03b);
  });

  it('gives every visible cell its own address', () => {
    const addresses = Array.from({ length: 36 }, (_, row) =>
      Array.from({ length: 28 }, (_, column) => cellAddress(column, row)),
    ).flat();
    expect(new Set(addresses).size).toBe(28 * 36);
  });
});

describe('writeVideo', () => {
  it('changes only the written cells, the last write winning', () => {
    const video = writeVideo(filledVideo(0x40, 0), {
      tiles: [...fillCells(3, 2, 0x10), { address: 4, value: 0x14 }],
      colors: [{ address: 3, value: 0x10 }],
    });
    expect(video.tiles.slice(2, 6)).toEqual([0x40, 0x10, 0x14, 0x40]);
    expect(video.colors.slice(2, 5)).toEqual([0, 0x10, 0]);
  });
});
