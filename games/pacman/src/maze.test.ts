import { describe, expect, it } from 'vitest';
import {
  dotWrites,
  ENERGIZER_ADDRESSES,
  isWall,
  mazeWrites,
  mirrorAddress,
  newMazeWrites,
  TILE,
} from './maze';
import { cellAddress, filledVideo, writeVideo } from './video';

const video = writeVideo(filledVideo(TILE.space, 0), newMazeWrites());

/** The tile at a screen cell. */
const tileAt = (column: number, row: number): number => video.tiles[cellAddress(column, row)] ?? -1;

describe('mirrorAddress', () => {
  it('swaps the left and right halves of the playfield', () => {
    expect(mirrorAddress(cellAddress(0, 5))).toBe(cellAddress(27, 5));
    expect(mirrorAddress(cellAddress(13, 30))).toBe(cellAddress(14, 30));
  });
});

describe('mazeWrites', () => {
  it('draws only wall tiles', () => {
    expect(mazeWrites().every((write) => isWall(write.value))).toBe(true);
  });

  it('closes the playfield with walls on rows 3 and 33', () => {
    Array.from({ length: 28 }, (_, column) => column).forEach((column) => {
      expect(isWall(tileAt(column, 3))).toBe(true);
      expect(isWall(tileAt(column, 33))).toBe(true);
    });
  });

  it('leaves the tunnels open on row 17', () => {
    expect(isWall(tileAt(0, 17))).toBe(false);
    expect(isWall(tileAt(27, 17))).toBe(false);
  });
});

describe('dotWrites', () => {
  it('places 240 dots and 4 energizers', () => {
    expect(dotWrites().filter((write) => write.value === TILE.dot)).toHaveLength(240);
    expect(video.tiles.filter((tile) => tile === TILE.dot)).toHaveLength(240);
    expect(ENERGIZER_ADDRESSES.map((address) => video.tiles[address])).toEqual([
      TILE.energizer,
      TILE.energizer,
      TILE.energizer,
      TILE.energizer,
    ]);
  });

  it('never puts a dot on a wall', () => {
    expect(
      dotWrites().every((write) => mazeWrites().every((w) => w.address !== write.address)),
    ).toBe(true);
  });

  it('starts the dots at the top left corner, next to the wall', () => {
    expect(tileAt(1, 4)).toBe(TILE.dot);
    expect(tileAt(26, 4)).toBe(TILE.dot);
  });
});
