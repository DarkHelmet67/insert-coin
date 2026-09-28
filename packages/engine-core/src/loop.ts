import { FixedStepClock, type FixedStepClockOptions } from './clock';

/** Abstracts `requestAnimationFrame` so the loop can run with a fake clock in tests. */
export interface FrameScheduler {
  request(callback: (timeMs: number) => void): number;
  cancel(id: number): void;
}

export const animationFrameScheduler: FrameScheduler = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (id) => cancelAnimationFrame(id),
};

export interface GameLoopOptions extends FixedStepClockOptions {
  /** Advances the simulation by exactly `dt` seconds. Called zero or more times per frame. */
  update: (dt: number) => void;
  /** Draws the current state. Called once per frame, after the updates. */
  render: (alpha: number) => void;
  scheduler?: FrameScheduler;
}

export interface GameLoop {
  start(): void;
  stop(): void;
  readonly running: boolean;
}

/** Creates a fixed-timestep game loop: the simulation ticks at a constant rate whatever the display refresh rate. */
export function createGameLoop({
  update,
  render,
  scheduler = animationFrameScheduler,
  ...clockOptions
}: GameLoopOptions): GameLoop {
  const clock = new FixedStepClock(clockOptions);
  let frameId: number | undefined;
  let lastTimeMs: number | undefined;

  const frame = (timeMs: number): void => {
    frameId = scheduler.request(frame);
    const elapsed = lastTimeMs === undefined ? 0 : (timeMs - lastTimeMs) / 1000;
    lastTimeMs = timeMs;

    const steps = clock.advance(elapsed);
    for (let i = 0; i < steps; i++) update(clock.step);
    render(clock.alpha);
  };

  return {
    start() {
      if (frameId !== undefined) return;
      clock.reset();
      lastTimeMs = undefined;
      frameId = scheduler.request(frame);
    },
    stop() {
      if (frameId === undefined) return;
      scheduler.cancel(frameId);
      frameId = undefined;
    },
    get running() {
      return frameId !== undefined;
    },
  };
}
