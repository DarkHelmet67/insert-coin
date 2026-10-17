import { describe, expect, it } from 'vitest';
import {
  decidePacMan,
  demoTarget,
  reversePacMan,
  turnPacManNow,
  updateAutoPacMan,
} from './autopilot';
import { corridorPacMan, corridorWalls } from './corridor';
import { DIRECTION } from './geometry';
import { levelSettings } from './levels';
import { newPacMan, type PacMan } from './pacman';
import { filledVideo, writeVideo } from './video';

/** Pac-Man in the corridor, moving at every update. */
const runner = (): PacMan => ({
  ...corridorPacMan(newPacMan(0xffffffff, 0xffffffff)),
});

/** The corridor of the attract mode. */
const tiles = writeVideo(filledVideo(0x40, 0), { tiles: corridorWalls() }).tiles;

describe('Pac-Man driven by the program', () => {
  it('moves one pixel along his step and asks for a decision at the middle of a tile', () => {
    const start = { ...runner(), position: { x: 0x24, y: 0x94 }, tile: { x: 0x22, y: 0x32 } };
    const move = updateAutoPacMan({ ...start, nextTile: { x: 0x23, y: 0x32 } }, false);
    expect(move.pacman.position).toEqual({ x: 0x25, y: 0x94 });
    expect(move.decides).toBe(true);
    expect(move.pacman.nextTile).toEqual({ x: 0x24, y: 0x32 });
    const between = updateAutoPacMan(move.pacman, false);
    expect(between.decides).toBe(false);
  });

  it('asks for nothing when the tile ahead is in a tunnel', () => {
    const move = updateAutoPacMan({ ...runner(), position: { x: 0x0c, y: 0x94 } }, false);
    expect(move.decides).toBe(false);
  });

  it('runs away from Pinky, and chases him once Blinky is blue', () => {
    const pacman = { ...runner(), tile: { x: 0x30, y: 0x32 } };
    expect(demoTarget(pacman, { pinkyTile: { x: 0x2c, y: 0x32 }, blinkyBlue: false })).toEqual({
      x: 0x34,
      y: 0x32,
    });
    expect(demoTarget(pacman, { pinkyTile: { x: 0x2c, y: 0x32 }, blinkyBlue: true })).toEqual({
      x: 0x2c,
      y: 0x32,
    });
  });

  it('keeps to the corridor whatever the target', () => {
    const pacman = { ...runner(), nextTile: { x: 0x28, y: 0x32 } };
    const decided = decidePacMan(
      pacman,
      { pinkyTile: { x: 0x28, y: 0x20 }, blinkyBlue: true },
      tiles,
    );
    expect(decided.wanted).toBe(DIRECTION.left);
  });

  it('turns back at the next tile, or at once', () => {
    expect(reversePacMan(runner()).wanted).toBe(DIRECTION.right);
    expect(reversePacMan(runner()).orientation).toBe(DIRECTION.left);
    const now = turnPacManNow(runner());
    expect(now.orientation).toBe(DIRECTION.right);
    expect(now.step).toEqual({ x: 0xff, y: 0 });
  });

  it('pauses after a meal and follows his speed, as with the joystick', () => {
    const settings = levelSettings(1);
    const pacman = { ...runner(), speed: settings.speeds.pacman, pause: 1 };
    expect(updateAutoPacMan(pacman, false).pacman.position).toEqual(pacman.position);
  });
});
