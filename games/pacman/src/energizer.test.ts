import { describe, expect, it } from 'vitest';
import {
  blinkEnergizers,
  flashGhosts,
  NO_FRIGHT,
  paintEyes,
  startFright,
  tickFright,
} from './energizer';
import { GHOST, GHOST_IDS, newGhost, PALETTE } from './ghosts';
import { levelSettings } from './levels';
import { COLOR } from './maze';
import { filledVideo } from './video';

const ghosts = GHOST_IDS.map((id) => newGhost(id, levelSettings(1).speeds));

describe('startFright', () => {
  it('turns every ghost blue and around, and starts the blue time', () => {
    const started = startFright(ghosts, 720);
    expect(started.ghosts.every((ghost) => ghost.blue && ghost.reverse)).toBe(true);
    expect(started.ghosts.every((ghost) => ghost.palette === PALETTE.blue)).toBe(true);
    expect(started.fright).toEqual({ active: true, timer: 720, eaten: 0, flashFrames: 0 });
  });
});

describe('tickFright', () => {
  it('counts down and ends the blue time, leaving the eyes blue', () => {
    const started = startFright(ghosts, 2);
    const withEyes = started.ghosts.map((ghost) =>
      ghost.id === GHOST.pinky ? { ...ghost, eyes: 'toDoor' as const } : ghost,
    );
    const once = tickFright(withEyes, started.fright);
    expect(once.fright.timer).toBe(1);
    const over = tickFright(once.ghosts, once.fright);
    expect(over.fright).toEqual(NO_FRIGHT);
    expect(over.ghosts.map((ghost) => ghost.blue)).toEqual([false, true, false, false]);
  });

  it('ends at once when no ghost is blue any more', () => {
    expect(tickFright(ghosts, { ...NO_FRIGHT, active: true, timer: 500 }).fright).toEqual(
      NO_FRIGHT,
    );
  });
});

describe('flashGhosts', () => {
  const started = startFright(ghosts, 720);

  it('checks the colors every 14 frames', () => {
    const checked = flashGhosts(started.ghosts, started.fright);
    expect(checked.fright.flashFrames).toBe(13);
  });

  it('flashes white when less than 256 updates of blue time are left', () => {
    const late = { ...started.fright, timer: 0xff };
    const once = flashGhosts(started.ghosts, late);
    expect(once.ghosts[0]?.palette).toBe(PALETTE.white);
    const twice = flashGhosts(once.ghosts, { ...once.fright, flashFrames: 0 });
    expect(twice.ghosts[0]?.palette).toBe(PALETTE.blue);
  });

  it('gives back their own colors to ghosts no longer blue', () => {
    const back = flashGhosts(
      started.ghosts.map((ghost) => ({ ...ghost, blue: false })),
      NO_FRIGHT,
    );
    expect(back.ghosts.map((ghost) => ghost.palette)).toEqual([1, 3, 5, 7]);
  });
});

describe('paintEyes', () => {
  it('shows only the eyes of eaten ghosts', () => {
    const eyes = paintEyes(
      ghosts.slice(0, 1).map((ghost) => ({ ...ghost, eyes: 'toDoor' as const })),
    );
    expect(eyes[0]?.palette).toBe(PALETTE.eyes);
  });
});

describe('blinkEnergizers', () => {
  it('switches the four energizers between the maze color and black', () => {
    const colors = filledVideo(0x40, COLOR.maze).colors;
    expect(blinkEnergizers(colors).map((write) => write.value)).toEqual([0, 0, 0, 0]);
  });
});
