import { describe, expect, it } from 'vitest';
import { tileAddress } from './geometry';
import { TILE } from './maze';
import { NO_JOYSTICK } from './pacman';
import { updatePlaying } from './frame';
import { newPlaying, type Playing } from './playing';
import { SCORE_ADDRESS } from './score';

/** The game after `frames` frames with the joystick at rest. */
const run = (playing: Playing, frames: number): Playing =>
  Array.from({ length: frames }).reduce<Playing>(
    (current) => updatePlaying(current, NO_JOYSTICK),
    playing,
  );

describe('updatePlaying', () => {
  it('eats the dots on the way: 10 points each, the tile cleared, the score shown', () => {
    const start = newPlaying(0);
    const later = run(start, 60);
    expect(later.dotsEaten).toBeGreaterThan(3);
    expect(later.score).toBe(later.dotsEaten * 10);
    expect(later.video.tiles[tileAddress(later.pacman.tile)]).toBe(TILE.space);
    expect(later.video.tiles[SCORE_ADDRESS + 1]).toBe(later.dotsEaten);
  });

  it('beats the high score as soon as the score passes it', () => {
    const later = run(newPlaying(20), 60);
    expect(later.hiScore).toBe(later.score);
  });
});
