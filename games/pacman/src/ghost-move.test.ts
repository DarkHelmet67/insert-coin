import { describe, expect, it } from 'vitest';
import { DIRECTION } from './geometry';
import { NO_ELROY } from './ghost-modes';
import { updateGhost, type ElroySpeeds, type GhostMove } from './ghost-move';
import { GHOST, newGhost, type Ghost } from './ghosts';
import { levelSettings } from './levels';
import { COLOR, mazeColorWrites } from './maze';
import { filledVideo, writeVideo } from './video';

const colors = writeVideo(filledVideo(0x40, 0), { colors: mazeColorWrites(false, true) }).colors;
const speeds = levelSettings(1).speeds;
const elroySpeeds: ElroySpeeds = { elroy1: speeds.elroy1, elroy2: speeds.elroy2 };
const FULL = { normal: 0xffffffff, fright: 0xffffffff, tunnel: 0xffffffff };

/** The moves of a ghost over `updates` updates. */
const run = (ghost: Ghost, updates: number): readonly GhostMove[] =>
  Array.from({ length: updates }).reduce<readonly GhostMove[]>(
    (moves) => [...moves, updateGhost(moves.at(-1)?.ghost ?? ghost, colors, NO_ELROY, elroySpeeds)],
    [],
  );

describe('updateGhost', () => {
  const blinky = { ...newGhost(GHOST.blinky, speeds), speeds: FULL };

  it('leaves the ghosts in the house alone', () => {
    const pinky = newGhost(GHOST.pinky, speeds);
    expect(run(pinky, 10).at(-1)?.ghost).toEqual(pinky);
  });

  it('asks for a decision at the middle of a tile, for the way out of the next one', () => {
    const moves = run(blinky, 40);
    const deciding = moves.filter((move) => move.decision === 'target');
    // Above the house (columns 11-16 of row 14) a ghost may not turn up: no decisions there.
    // In the middle of column 10 (x $9C) Blinky chooses the way out of column 9 (tile $32).
    expect(deciding[0]?.ghost.position.x).toBe(0x9d);
    expect(deciding[0]?.ghost.nextTile).toEqual({ x: 0x32, y: 0x2c });
    expect(deciding).toHaveLength(2);
  });

  it('turns around at the middle of a tile when a reversal is pending', () => {
    const moves = run({ ...blinky, reverse: true }, 6);
    const last = moves.at(-1)?.ghost;
    expect(last?.orientation).toBe(DIRECTION.right);
    expect(last?.reverse).toBe(false);
    expect(last?.position.x).toBe(0x82);
  });

  it('slows down in the tunnel', () => {
    const inTunnel: Ghost = {
      ...newGhost(GHOST.blinky, speeds),
      position: { x: 0x10, y: 0x84 },
      tile: { x: 0x20, y: 0x30 },
      nextTile: { x: 0x20, y: 0x30 },
    };
    expect(colors[0x40 + 0x10]).toBe(COLOR.tunnel);
    const moved = run(inTunnel, 32).at(-1)?.ghost;
    expect(moved?.position.x).toBe(0x10 + 8);
  });
});
