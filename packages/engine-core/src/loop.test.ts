import { describe, expect, it, vi } from 'vitest';
import { createGameLoop, elapsedSeconds, simulateSteps, type FrameScheduler } from './loop';

/** A scheduler driven by hand: `tick(ms)` fires the pending frame at that timestamp. */
const fakeScheduler = () => {
  let pending: ((timeMs: number) => void) | undefined;
  let nextId = 1;
  const scheduler: FrameScheduler = {
    request: (callback) => {
      pending = callback;
      return nextId++;
    },
    cancel: () => {
      pending = undefined;
    },
  };
  /** Runs the pending frame callback, if any, as if the display refreshed at `timeMs`. */
  const tick = (timeMs: number): void => {
    const callback = pending;
    pending = undefined;
    callback?.(timeMs);
  };
  return { scheduler, tick, hasPending: () => pending !== undefined };
};

/** Test update: the state counts elapsed simulation time. */
const addTime = (time: number, dt: number): number => time + dt;

describe('simulateSteps', () => {
  it('applies update the given number of times', () => {
    expect(simulateSteps(0, 3, 1, addTime)).toBe(3);
    expect(simulateSteps(0, 0, 1, addTime)).toBe(0);
  });
});

describe('elapsedSeconds', () => {
  it('is zero on the first frame and converts milliseconds afterwards', () => {
    expect(elapsedSeconds(undefined, 1000)).toBe(0);
    expect(elapsedSeconds(1000, 1030)).toBeCloseTo(0.03);
  });
});

describe('createGameLoop', () => {
  it('updates the state at a fixed rate and renders once per frame', () => {
    const { scheduler, tick } = fakeScheduler();
    const render = vi.fn();
    const loop = createGameLoop({
      initialState: 0,
      update: addTime,
      render,
      scheduler,
      step: 0.01,
    });

    loop.start();
    tick(1000); // first frame only sets the time reference
    expect(loop.state()).toBe(0);
    expect(render).toHaveBeenCalledTimes(1);

    tick(1030); // 30 ms later: three 10 ms steps
    expect(loop.state()).toBeCloseTo(0.03);
    expect(render).toHaveBeenCalledTimes(2);
    expect(render).toHaveBeenLastCalledWith(loop.state(), expect.any(Number));
  });

  it('stops scheduling frames after stop()', () => {
    const { scheduler, tick, hasPending } = fakeScheduler();
    const loop = createGameLoop({ initialState: 0, update: addTime, render: vi.fn(), scheduler });

    loop.start();
    tick(0);
    expect(loop.isRunning()).toBe(true);
    loop.stop();
    expect(loop.isRunning()).toBe(false);
    expect(hasPending()).toBe(false);
  });

  it('does not simulate the paused time after a restart', () => {
    const { scheduler, tick } = fakeScheduler();
    const loop = createGameLoop({
      initialState: 0,
      update: addTime,
      render: vi.fn(),
      scheduler,
      step: 0.01,
    });

    loop.start();
    tick(0);
    loop.stop();
    loop.start();
    tick(60_000);
    expect(loop.state()).toBe(0);
  });
});
