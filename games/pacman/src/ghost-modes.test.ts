import { describe, expect, it } from 'vitest';
import {
  isScatter,
  NEW_MODE_CLOCK,
  NO_ELROY,
  tickModes,
  updateElroy,
  type ModeClock,
} from './ghost-modes';
import { levelSettings } from './levels';

const changes = levelSettings(1).modeChanges;

/** The clock after `frames` frames, counting the reversals. */
const run = (frames: number, energized = false): { clock: ModeClock; reversals: number } =>
  Array.from({ length: frames }).reduce<{ clock: ModeClock; reversals: number }>(
    (acc) => {
      const tick = tickModes(acc.clock, changes, energized);
      return { clock: tick.clock, reversals: acc.reversals + (tick.reverse ? 1 : 0) };
    },
    { clock: NEW_MODE_CLOCK, reversals: 0 },
  );

describe('tickModes', () => {
  it('scatters for 7 seconds, then chases, turning the ghosts around', () => {
    expect(isScatter(run(419).clock)).toBe(true);
    const after = run(420);
    expect(isScatter(after.clock)).toBe(false);
    expect(after.reversals).toBe(1);
  });

  it('chases forever after the seventh change', () => {
    const late = run(6000);
    expect(late.clock.index).toBe(7);
    expect(late.reversals).toBe(7);
    expect(isScatter(late.clock)).toBe(false);
  });

  it('stops while the ghosts are blue', () => {
    expect(run(500, true).clock).toEqual(NEW_MODE_CLOCK);
  });
});

describe('updateElroy', () => {
  it('waits for Clyde to leave the house', () => {
    expect(updateElroy(NO_ELROY, 240, [20, 10], false)).toEqual(NO_ELROY);
  });

  it('turns Blinky into Elroy 1 at 20 dots left, Elroy 2 at 10 on level 1', () => {
    expect(updateElroy(NO_ELROY, 223, [20, 10], true)).toEqual(NO_ELROY);
    expect(updateElroy(NO_ELROY, 224, [20, 10], true)).toEqual({ elroy1: true, elroy2: false });
    expect(updateElroy(NO_ELROY, 234, [20, 10], true)).toEqual({ elroy1: true, elroy2: true });
  });
});
