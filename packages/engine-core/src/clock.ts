/** Fixed settings of a clock: how long a simulation step is and how much real time a frame may count. */
export interface ClockConfig {
  /** Duration of one simulation step, in seconds. */
  readonly step: number;
  /** Longest real frame accepted, in seconds. Longer pauses (e.g. a background tab) are clamped. */
  readonly maxFrameTime: number;
}

/** What a clock remembers between frames: real time not yet turned into simulation steps. */
export interface ClockState {
  /** Seconds of real time waiting to be simulated. Always smaller than one step after `advanceClock`. */
  readonly accumulator: number;
}

/** Result of `advanceClock`: the new clock state and how many steps the game must simulate now. */
export interface ClockTick {
  readonly state: ClockState;
  readonly steps: number;
}

/** A clock with no pending time, to use when the game (re)starts. */
export const initialClockState: ClockState = { accumulator: 0 };

// Absorbs floating point drift so that exactly one step of elapsed time counts as one step.
const EPSILON = 1e-9;

/**
 * Builds a clock configuration, filling in arcade-friendly defaults.
 * @param options - Overrides for the defaults.
 * @param options.step - Defaults to 1/60 s (60 updates per second).
 * @param options.maxFrameTime - Defaults to 0.25 s.
 * @throws RangeError when `step` is not positive.
 */
export const createClockConfig = ({
  step = 1 / 60,
  maxFrameTime = 0.25,
}: Partial<ClockConfig> = {}): ClockConfig => {
  if (step <= 0) throw new RangeError('step must be positive');
  return { step, maxFrameTime };
};

/** Keeps a real frame duration between 0 and `maxFrameTime` seconds. */
export const clampFrameTime = (elapsed: number, maxFrameTime: number): number =>
  Math.min(Math.max(elapsed, 0), maxFrameTime);

/**
 * Adds `elapsed` seconds of real time to the clock and splits it into whole simulation steps.
 * Pure function: this is the heart of the fixed-timestep loop, and the part worth unit testing.
 */
export const advanceClock = (
  config: ClockConfig,
  state: ClockState,
  elapsed: number,
): ClockTick => {
  const accumulator = state.accumulator + clampFrameTime(elapsed, config.maxFrameTime);
  const steps = Math.floor((accumulator + EPSILON) / config.step);
  return {
    state: { accumulator: Math.max(0, accumulator - steps * config.step) },
    steps,
  };
};

/** How far (0..1) real time is into the next step: useful to interpolate rendering between two states. */
export const interpolationAlpha = (config: ClockConfig, state: ClockState): number =>
  state.accumulator / config.step;
