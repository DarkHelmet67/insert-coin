import { describe, expect, it } from 'vitest';
import { newThump, speedUpThump, THUMP_MIN_PAUSE, updateThump, type Thump } from './thump';

/** The frames, from the start, on which a new beat begins. */
const beatFrames = (thump: Thump, frames: number): readonly number[] =>
  Array.from({ length: frames }).reduce<{ thump: Thump; starts: readonly number[] }>(
    ({ thump: current, starts }, _, frame) => {
      const next = updateThump(current, true);
      return { thump: next, starts: next.beats > current.beats ? [...starts, frame] : starts };
    },
    { thump, starts: [] },
  ).starts;

describe('updateThump', () => {
  it('starts with the lower note, then alternates', () => {
    const first = beatFrames(newThump, 4);
    expect(first).toEqual([3]);
    const one = [0, 1, 2, 3].reduce((thump) => updateThump(thump, true), newThump);
    expect(one.high).toBe(false);
  });

  it('beats every 4 + pause frames', () => {
    const [first = 0, second = 0] = beatFrames(newThump, 200);
    expect(second - first).toBe(4 + 48);
    const [, fastFirst = 0, fastSecond = 0] = beatFrames({ ...newThump, pause: 8 }, 100);
    expect(fastSecond - fastFirst).toBe(12);
  });

  it('stays silent while inactive', () => {
    const silent = Array.from({ length: 100 }).reduce<Thump>(
      (thump) => updateThump(thump, false),
      newThump,
    );
    expect(silent.beats).toBe(0);
  });
});

describe('speedUpThump', () => {
  it('shortens the pause every 64 frames, down to 8', () => {
    expect(speedUpThump(newThump, 64).pause).toBe(47);
    expect(speedUpThump(newThump, 65).pause).toBe(48);
    expect(speedUpThump({ ...newThump, pause: THUMP_MIN_PAUSE }, 0).pause).toBe(8);
  });
});
