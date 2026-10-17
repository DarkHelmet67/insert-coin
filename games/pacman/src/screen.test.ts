import { describe, expect, it } from 'vitest';
import { ENERGIZER_ADDRESSES, TILE } from './maze';
import { allDots, blankVideo, gameStartVideo, mazeVideo, savedDots } from './screen';
import { writeVideo } from './video';

/** How many cells of `tiles` hold `tile`. */
const count = (tiles: readonly number[], tile: number) => tiles.filter((t) => t === tile).length;

describe('screens', () => {
  it('draws a new game with 240 dots and 4 energizers', () => {
    const video = gameStartVideo(0, 3);
    expect(count(video.tiles, TILE.dot)).toBe(240);
    expect(count(video.tiles, TILE.energizer)).toBe(4);
  });

  it('keeps the dots left when a life starts again', () => {
    const start = gameStartVideo(0, 3);
    const dot = allDots()[0]?.address ?? 0;
    const eaten = writeVideo(start, {
      tiles: [
        { address: dot, value: TILE.space },
        { address: ENERGIZER_ADDRESSES[0], value: TILE.space },
      ],
    });
    const again = mazeVideo(eaten, savedDots(eaten), 0, 2);
    expect(count(again.tiles, TILE.dot)).toBe(239);
    expect(count(again.tiles, TILE.energizer)).toBe(3);
  });

  it('spills the fruit row over the right half of the maze on level 256', () => {
    const normal = mazeVideo(blankVideo(gameStartVideo(0, 3)), allDots(), 254, 2);
    const broken = mazeVideo(blankVideo(gameStartVideo(0, 3)), allDots(), 255, 2);
    const changed = broken.tiles.filter((tile, i) => tile !== normal.tiles[i]).length;
    expect(changed).toBeGreaterThan(400);
    expect(count(broken.tiles, TILE.dot)).toBeLessThan(240);
  });
});
