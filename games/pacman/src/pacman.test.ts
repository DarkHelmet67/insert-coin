import { describe, expect, it } from 'vitest';
import { DIRECTION, tileAddress } from './geometry';
import { isWall, newMazeWrites, TILE } from './maze';
import {
  joystickDirection,
  newPacMan,
  NO_JOYSTICK,
  NO_PAUSE,
  updatePacMan,
  type Joystick,
  type PacMan,
} from './pacman';
import { filledVideo, writeVideo } from './video';

const tiles = writeVideo(filledVideo(TILE.space, 0), newMazeWrites()).tiles;
/** A speed that moves at every update, to count pixels easily. */
const FULL_SPEED = 0xffffffff;
const start = newPacMan(FULL_SPEED, FULL_SPEED);

/** Pac-Man after `updates` updates with the joystick held as given. */
const run = (pacman: PacMan, updates: number, joystick: Joystick = NO_JOYSTICK): PacMan =>
  Array.from({ length: updates }).reduce<PacMan>(
    (current) => updatePacMan(current, joystick, false, tiles).pacman,
    pacman,
  );

describe('joystickDirection', () => {
  it('tests left, right, up and down in this order, like the program', () => {
    expect(joystickDirection({ up: true, down: false, left: true, right: false })).toBe(
      DIRECTION.left,
    );
    expect(joystickDirection({ up: true, down: true, left: false, right: false })).toBe(
      DIRECTION.up,
    );
    expect(joystickDirection(NO_JOYSTICK)).toBeUndefined();
  });
});

describe('updatePacMan', () => {
  it('moves one pixel per bit set in the speed pattern', () => {
    const halfSpeed = newPacMan(0x55555555, FULL_SPEED);
    expect(run(halfSpeed, 32).position.x).toBe(0x80 + 16);
  });

  it('goes left from the start and stops in the middle of the last tile before the wall', () => {
    const stopped = run(start, 200);
    expect(stopped.position.x & 7).toBe(4);
    expect(isWall(tiles[tileAddress({ ...stopped.tile, x: stopped.tile.x + 1 })] ?? 0)).toBe(true);
    expect(run(stopped, 10).position).toEqual(stopped.position);
  });

  it('keeps going when the joystick asks for a wall, and turns as soon as it can', () => {
    const up: Joystick = { ...NO_JOYSTICK, up: true };
    // Below the start row is a wall: asking down changes nothing.
    expect(run(start, 4, { ...NO_JOYSTICK, down: true }).position.x).toBe(0x84);
    const turned = run(start, 60, up);
    expect(turned.orientation).toBe(DIRECTION.up);
    expect(turned.position.x & 7).toBe(4);
  });

  it('corners: turning before the middle of the tile, he is pulled back to the lane', () => {
    // Running left, Pac-Man enters the tile below the corridor of column 12 at x $88, four
    // pixels before its middle ($8C): he can already turn up.
    const before = run(start, 8);
    expect(before.position.x).toBe(0x88);
    const cornered = run(before, 1, { ...NO_JOYSTICK, up: true });
    expect(cornered.orientation).toBe(DIRECTION.up);
    expect(cornered.position).toEqual({ x: 0x89, y: 0xc3 });
    expect(run(cornered, 3, { ...NO_JOYSTICK, up: true }).position).toEqual({ x: 0x8c, y: 0xc0 });
  });

  it('waits after eating: a pause of 1 skips two updates', () => {
    const swallowing = { ...start, pause: 1 };
    const once = updatePacMan(swallowing, NO_JOYSTICK, false, tiles).pacman;
    const twice = updatePacMan(once, NO_JOYSTICK, false, tiles).pacman;
    expect(twice.position).toEqual(start.position);
    expect(twice.pause).toBe(NO_PAUSE);
    expect(updatePacMan(twice, NO_JOYSTICK, false, tiles).pacman.position.x).toBe(0x81);
  });

  it('goes through the tunnel and comes out on the other side', () => {
    const inTunnel: PacMan = {
      ...start,
      position: { x: 0xfc, y: 0x84 },
      tile: { x: 0x3d, y: 0x30 },
    };
    const through = run(inTunnel, 8);
    expect(through.position).toEqual({ x: 0x04, y: 0x84 });
    expect(through.tile.x).toBe(0x1e);
  });
});
