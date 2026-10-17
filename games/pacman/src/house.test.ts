import { describe, expect, it } from 'vitest';
import { DIRECTION } from './geometry';
import { GHOST, GHOST_IDS, newGhost, type Ghost } from './ghosts';
import { moveInHouse, NEW_HOUSE_CLOCK, release, releaseByTimer, tickHouseClock } from './house';
import { countDot, NEW_HOUSE_DOTS, releaseByDots, type HouseDots } from './house-dots';
import { levelSettings } from './levels';

const speeds = levelSettings(1).speeds;
const ghosts = GHOST_IDS.map((id) => newGhost(id, speeds));

/** A ghost after `steps` moves in the house. */
const steps = (ghost: Ghost, count: number): Ghost =>
  Array.from({ length: count }).reduce<Ghost>((current) => moveInHouse(current), ghost);

describe('moveInHouse', () => {
  it('bobs a waiting ghost between heights $78 and $80', () => {
    const pinky = ghosts[GHOST.pinky] as Ghost;
    const heights = Array.from({ length: 20 }, (_, i) => steps(pinky, i).position.y);
    expect(Math.min(...heights)).toBe(0x78);
    expect(Math.max(...heights)).toBe(0x80);
  });

  it('takes Inky to the middle, then up and out heading left', () => {
    const inky = release(ghosts[GHOST.inky] as Ghost);
    expect(inky.house).toBe('sideways');
    const middle = steps(inky, 16);
    expect(middle.position.x).toBe(0x80);
    expect(middle.house).toBe('up');
    const out = steps(middle, 0x7c - 0x64);
    expect(out.house).toBe('out');
    expect(out.position).toEqual({ x: 0x80, y: 0x64 });
    expect(out.orientation).toBe(DIRECTION.left);
    expect(out.nextTile).toEqual({ x: 0x2e, y: 0x2c });
  });
});

describe('tickHouseClock', () => {
  it('moves the house one frame out of two', () => {
    const first = tickHouseClock(NEW_HOUSE_CLOCK);
    const second = tickHouseClock(first.clock);
    expect([first.move, second.move]).toEqual([false, true]);
  });
});

describe('countDot and releaseByDots', () => {
  const limits = levelSettings(1).houseDotLimits;

  it('lets Pinky out at once on level 1, then counts 30 dots for Inky', () => {
    const first = releaseByDots(ghosts, NEW_HOUSE_DOTS, limits);
    expect(first.ghosts[GHOST.pinky]?.house).toBe('up');
    const dots = Array.from({ length: 30 }).reduce<HouseDots>(
      (counted) => countDot(counted, first.ghosts),
      first.dots,
    );
    expect(dots.personal).toEqual([0, 30, 0]);
    expect(releaseByDots(first.ghosts, dots, limits).ghosts[GHOST.inky]?.house).toBe('sideways');
  });

  it('after a death, uses the global counter: Pinky at 7, Inky at 17, Clyde drops it at 32', () => {
    const atSeven = releaseByDots(ghosts, { personal: [0, 0, 0], global: 7 }, limits);
    expect(atSeven.ghosts[GHOST.pinky]?.house).toBe('up');
    expect(atSeven.ghosts[GHOST.inky]?.house).toBe('home');
    const at32 = releaseByDots(ghosts, { personal: [0, 0, 0], global: 32 }, limits);
    expect(at32.dots.global).toBeUndefined();
    expect(at32.ghosts[GHOST.clyde]?.house).toBe('home');
  });
});

describe('releaseByTimer', () => {
  it('lets the first ghost at home out after 4 seconds without eating', () => {
    expect(releaseByTimer(ghosts, 238, 240, false).ghosts[GHOST.pinky]?.house).toBe('home');
    const out = releaseByTimer(ghosts, 239, 240, false);
    expect(out.ghosts[GHOST.pinky]?.house).toBe('up');
    expect(out.frames).toBe(0);
  });

  it('starts again at each dot', () => {
    expect(releaseByTimer(ghosts, 239, 240, true)).toEqual({ ghosts, frames: 0 });
  });
});
