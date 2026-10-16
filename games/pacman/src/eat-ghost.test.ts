import { describe, expect, it } from 'vitest';
import { updatePlaying } from './frame';
import { startFright } from './energizer';
import { GHOST } from './ghosts';
import { NO_JOYSTICK } from './pacman';
import { newPlaying, type Playing } from './playing';

/** A game with Blinky blue on Pac-Man's tile. */
const meeting = (): Playing => {
  const start = newPlaying(0);
  const fright = startFright(start.ghosts, 720);
  const ghosts = fright.ghosts.map((ghost) =>
    ghost.id === GHOST.blinky
      ? { ...ghost, tile: start.pacman.tile, position: start.pacman.position }
      : ghost,
  );
  return { ...start, ghosts, fright: fright.fright };
};

/** The game after `frames` frames. */
const run = (playing: Playing, frames: number): Playing =>
  Array.from({ length: frames }).reduce<Playing>(
    (current) => updatePlaying(current, NO_JOYSTICK),
    playing,
  );

describe('eating a ghost', () => {
  it('scores 200, stands still for a second, then sends the eyes home', () => {
    const met = run(meeting(), 1);
    expect(met.score).toBe(200);
    expect(met.eating?.ghost).toBe(GHOST.blinky);
    const during = run(met, 30);
    expect(during.pacman.position).toEqual(met.pacman.position);
    const after = run(met, 62);
    expect(after.eating).toBeUndefined();
    expect(after.ghosts[GHOST.blinky]?.eyes).toBe('toDoor');
    expect(after.killer).toBeUndefined();
  });

  it('is deadly when the ghost is not blue', () => {
    const start = meeting();
    const caught = run(
      {
        ...start,
        ghosts: start.ghosts.map((ghost) => ({ ...ghost, blue: false })),
      },
      1,
    );
    expect(caught.killer).toBe(GHOST.blinky);
  });
});
