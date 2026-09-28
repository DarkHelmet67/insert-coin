import { describe, expect, it, vi } from 'vitest';
import { createGameLoop, type FrameScheduler } from './loop';

/** A scheduler driven by hand: `tick(ms)` fires the pending frame at that timestamp. */
function fakeScheduler() {
  let pending: ((timeMs: number) => void) | undefined;
  let nextId = 1;
  const scheduler: FrameScheduler = {
    request(callback) {
      pending = callback;
      return nextId++;
    },
    cancel() {
      pending = undefined;
    },
  };
  const tick = (timeMs: number) => {
    const callback = pending;
    pending = undefined;
    callback?.(timeMs);
  };
  return { scheduler, tick, hasPending: () => pending !== undefined };
}

describe('createGameLoop', () => {
  it('calls update at a fixed rate and render once per frame', () => {
    const { scheduler, tick } = fakeScheduler();
    const update = vi.fn();
    const render = vi.fn();
    const loop = createGameLoop({ update, render, scheduler, step: 0.01 });

    loop.start();
    tick(1000); // first frame only sets the time reference
    expect(update).not.toHaveBeenCalled();
    expect(render).toHaveBeenCalledTimes(1);

    tick(1030); // 30 ms later: three 10 ms steps
    expect(update).toHaveBeenCalledTimes(3);
    expect(update).toHaveBeenCalledWith(0.01);
    expect(render).toHaveBeenCalledTimes(2);
  });

  it('stops scheduling frames after stop()', () => {
    const { scheduler, tick, hasPending } = fakeScheduler();
    const loop = createGameLoop({ update: vi.fn(), render: vi.fn(), scheduler });

    loop.start();
    tick(0);
    expect(loop.running).toBe(true);
    loop.stop();
    expect(loop.running).toBe(false);
    expect(hasPending()).toBe(false);
  });

  it('does not count the paused time after a restart', () => {
    const { scheduler, tick } = fakeScheduler();
    const update = vi.fn();
    const loop = createGameLoop({ update, render: vi.fn(), scheduler, step: 0.01 });

    loop.start();
    tick(0);
    loop.stop();
    loop.start();
    tick(60_000);
    expect(update).not.toHaveBeenCalled();
  });
});
