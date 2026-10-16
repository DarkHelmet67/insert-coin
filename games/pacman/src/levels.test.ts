import { describe, expect, it } from 'vitest';
import { levelSettings } from './levels';

/** Pixels moved in 32 updates: the bits set in a speed pattern. */
const bitsSet = (pattern: number): number => pattern.toString(2).replaceAll('0', '').length;

describe('levelSettings', () => {
  it('gives level 1 the speeds of the Dossier: Pac-Man 80%, ghosts 75%, blue 50%, tunnel 40%', () => {
    const { speeds } = levelSettings(1);
    // 100% would be 20 pixels out of 32 updates.
    expect(bitsSet(speeds.pacman)).toBe(16);
    expect(bitsSet(speeds.ghost)).toBe(15);
    expect(bitsSet(speeds.ghostFright)).toBe(10);
    expect(bitsSet(speeds.ghostTunnel)).toBe(8);
    expect(speeds.ghost).toBe(0x2aaa5555);
  });

  it('switches scatter and chase at 7, 27, 34, 54, 59, 79 and 84 seconds on level 1', () => {
    expect(levelSettings(1).modeChanges).toEqual([420, 1620, 2040, 3240, 3540, 4740, 5040]);
  });

  it('reads the house, Elroy and blue-time tables', () => {
    const level1 = levelSettings(1);
    expect(level1.houseDotLimits).toEqual([0, 30, 60]);
    expect(level1.elroyDots).toEqual([20, 10]);
    expect(level1.frightTime).toBe(720);
    expect(level1.houseTimer).toBe(240);
    expect(levelSettings(2).houseDotLimits).toEqual([0, 0, 50]);
  });

  it('repeats level 21 forever, where the ghosts never turn blue', () => {
    expect(levelSettings(300)).toEqual(levelSettings(21));
    expect(levelSettings(21).frightTime).toBe(1);
  });
});
