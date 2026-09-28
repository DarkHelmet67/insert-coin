import {
  advanceClock,
  createClockConfig,
  initialClockState,
  interpolationAlpha,
  type ClockConfig,
  type ClockState,
} from './clock';

/** Abstracts `requestAnimationFrame` so the loop can run with a fake clock in tests. */
export interface FrameScheduler {
  /** Asks for `callback` to run on the next frame and returns an id to cancel it. */
  readonly request: (callback: (timeMs: number) => void) => number;
  /** Cancels a frame requested with `request`. */
  readonly cancel: (id: number) => void;
}

/** The browser scheduler: one frame per display refresh. */
export const animationFrameScheduler: FrameScheduler = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (id) => cancelAnimationFrame(id),
};

/** What a game gives the loop: its starting state, a pure update function and a render function. */
export interface GameLoopOptions<State> extends Partial<ClockConfig> {
  /** State of the game when the loop starts. */
  readonly initialState: State;
  /** Returns the state `dt` seconds later. Must be pure: no drawing, no side effects. */
  readonly update: (state: State, dt: number) => State;
  /** Draws a state. Called once per frame, after the updates. */
  readonly render: (state: State, alpha: number) => void;
  /** Frame source; defaults to `requestAnimationFrame`. */
  readonly scheduler?: FrameScheduler;
}

/** Handle returned by `createGameLoop` to control a running game. */
export interface GameLoop<State> {
  /** Starts (or resumes) the loop. Time spent stopped is not simulated. */
  readonly start: () => void;
  /** Stops the loop after the current frame. */
  readonly stop: () => void;
  /** Whether the loop is currently running. */
  readonly isRunning: () => boolean;
  /** The latest game state. */
  readonly state: () => State;
}

/** Applies `update` `steps` times in a row, each time with the same fixed `dt`. */
export const simulateSteps = <State>(
  state: State,
  steps: number,
  dt: number,
  update: (state: State, dt: number) => State,
): State => Array.from({ length: steps }).reduce<State>((current) => update(current, dt), state);

/** Converts two `requestAnimationFrame` timestamps (ms) into elapsed seconds; 0 on the first frame. */
export const elapsedSeconds = (previousMs: number | undefined, nowMs: number): number =>
  previousMs === undefined ? 0 : (nowMs - previousMs) / 1000;

/**
 * Creates a fixed-timestep game loop: the game state advances at a constant rate
 * whatever the display refresh rate. The game logic stays pure (`update`); the loop is
 * the only place holding mutable state, kept private inside this closure.
 */
export const createGameLoop = <State>({
  initialState,
  update,
  render,
  scheduler = animationFrameScheduler,
  ...clockOptions
}: GameLoopOptions<State>): GameLoop<State> => {
  const config = createClockConfig(clockOptions);
  let state = initialState;
  let clock: ClockState = initialClockState;
  let frameId: number | undefined;
  let lastTimeMs: number | undefined;

  /** Runs once per display frame: simulate the elapsed time, then draw. */
  const frame = (timeMs: number): void => {
    frameId = scheduler.request(frame);
    const tick = advanceClock(config, clock, elapsedSeconds(lastTimeMs, timeMs));
    lastTimeMs = timeMs;
    clock = tick.state;
    state = simulateSteps(state, tick.steps, config.step, update);
    render(state, interpolationAlpha(config, clock));
  };

  return {
    start: () => {
      if (frameId !== undefined) return;
      clock = initialClockState;
      lastTimeMs = undefined;
      frameId = scheduler.request(frame);
    },
    stop: () => {
      if (frameId === undefined) return;
      scheduler.cancel(frameId);
      frameId = undefined;
    },
    isRunning: () => frameId !== undefined,
    state: () => state,
  };
};
