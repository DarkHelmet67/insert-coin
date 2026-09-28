import { describe, expect, it } from 'vitest';
import {
  advanceClock,
  clampFrameTime,
  createClockConfig,
  initialClockState,
  interpolationAlpha,
  type ClockConfig,
  type ClockState,
} from './clock';

/** Feeds a list of frame durations to the clock and returns the steps of each frame plus the final state. */
const runFrames = (
  config: ClockConfig,
  frames: readonly number[],
): { readonly steps: readonly number[]; readonly state: ClockState } =>
  frames.reduce<{ readonly steps: readonly number[]; readonly state: ClockState }>(
    (acc, elapsed) => {
      const tick = advanceClock(config, acc.state, elapsed);
      return { steps: [...acc.steps, tick.steps], state: tick.state };
    },
    { steps: [], state: initialClockState },
  );

describe('createClockConfig', () => {
  it('defaults to 60 steps per second', () => {
    expect(createClockConfig()).toEqual({ step: 1 / 60, maxFrameTime: 0.25 });
  });

  it('rejects a non positive step', () => {
    expect(() => createClockConfig({ step: 0 })).toThrow(RangeError);
  });
});

describe('clampFrameTime', () => {
  it('keeps frame times between 0 and the maximum', () => {
    expect(clampFrameTime(-1, 0.25)).toBe(0);
    expect(clampFrameTime(0.1, 0.25)).toBe(0.1);
    expect(clampFrameTime(5, 0.25)).toBe(0.25);
  });
});

describe('advanceClock', () => {
  it('runs one step per step of elapsed time', () => {
    const config = createClockConfig({ step: 1 / 60 });
    expect(runFrames(config, [1 / 60, 1 / 60]).steps).toEqual([1, 1]);
  });

  it('accumulates short frames until a whole step has passed', () => {
    const config = createClockConfig({ step: 0.1 });
    const { steps, state } = runFrames(config, [0.04, 0.04, 0.04]);
    expect(steps).toEqual([0, 0, 1]);
    expect(interpolationAlpha(config, state)).toBeCloseTo(0.2);
  });

  it('runs several steps after a long frame', () => {
    const config = createClockConfig({ step: 0.01 });
    expect(advanceClock(config, initialClockState, 0.035).steps).toBe(3);
  });

  it('clamps very long pauses to avoid a burst of updates', () => {
    const config = createClockConfig({ step: 0.01, maxFrameTime: 0.1 });
    expect(advanceClock(config, initialClockState, 5).steps).toBe(10);
  });

  it('does not modify the state it receives', () => {
    const config = createClockConfig({ step: 0.1 });
    const state = { accumulator: 0.05 };
    advanceClock(config, state, 0.2);
    expect(state).toEqual({ accumulator: 0.05 });
  });

  it('keeps the step count exact over many 60 Hz frames', () => {
    const config = createClockConfig({ step: 1 / 60 });
    const { steps } = runFrames(
      config,
      Array.from({ length: 6000 }, () => 1 / 60),
    );
    expect(steps.reduce((sum, n) => sum + n, 0)).toBe(6000);
  });
});
