import { describe, expect, it } from 'vitest';
import { ALL_RELEASED, CHASE_ENERGIZER, chasePlaying, updateChase } from './chase';
import { GHOST } from './ghosts';
import { TILE } from './maze';
import { newPlaying, type Playing } from './playing';

/** The chase run until it is over, or for at most `frames` frames. */
const runChase = (frames: number): { playing: Playing; released: number; frames: number } => {
  let playing = chasePlaying(newPlaying(0));
  let released = 0;
  for (let frame = 1; frame <= frames; frame += 1) {
    const next = updateChase(playing, released);
    if (next.over) return { playing, released, frames: frame };
    playing = next.playing;
    released = next.released;
  }
  return { playing, released, frames };
};

describe('the chase of the attract mode', () => {
  it('puts the energizer at the end of the row and everyone at its start', () => {
    const playing = chasePlaying(newPlaying(0));
    expect(playing.demo).toBe(true);
    expect(playing.video.tiles[CHASE_ENERGIZER]).toBe(TILE.energizer);
    expect(playing.pacman.tile).toEqual({ x: 0x1f, y: 0x32 });
    expect(playing.ghosts.every((ghost) => ghost.house === 'home')).toBe(true);
  });

  it('lets Blinky out when Pac-Man reaches column $21', () => {
    const early = runChase(10);
    expect(early.released).toBe(0);
    const blinky = runChase(20);
    expect(blinky.released).toBeGreaterThan(0);
    expect(blinky.playing.ghosts[GHOST.blinky]?.house).toBe('out');
  });

  it('ends once the four ghosts are eaten, without scoring', () => {
    const chase = runChase(1000);
    expect(chase.released).toBe(ALL_RELEASED);
    expect(chase.playing.fright.eaten).toBe(4);
    expect(chase.frames).toBeLessThan(1000);
    expect(chase.playing.score).toBe(0);
    expect(chase.playing.video.tiles[CHASE_ENERGIZER]).toBe(TILE.space);
  });
});
