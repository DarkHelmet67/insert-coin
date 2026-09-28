export interface FixedStepClockOptions {
  /** Duration of one simulation step, in seconds. Default: 1/60. */
  step?: number;
  /** Longest real frame accepted, in seconds. Longer pauses (e.g. a background tab) are clamped. Default: 0.25. */
  maxFrameTime?: number;
}

// Absorbs floating point drift so that exactly one step of elapsed time counts as one step.
const EPSILON = 1e-9;

/**
 * Turns irregular real frame times into a whole number of fixed simulation steps.
 * Pure arithmetic, no browser APIs: this is the part of the game loop worth unit testing.
 */
export class FixedStepClock {
  readonly step: number;
  readonly maxFrameTime: number;
  #accumulator = 0;

  constructor({ step = 1 / 60, maxFrameTime = 0.25 }: FixedStepClockOptions = {}) {
    if (step <= 0) throw new RangeError('step must be positive');
    this.step = step;
    this.maxFrameTime = maxFrameTime;
  }

  /** Adds `elapsed` seconds of real time and returns how many fixed steps to simulate. */
  advance(elapsed: number): number {
    this.#accumulator += Math.min(Math.max(elapsed, 0), this.maxFrameTime);
    const steps = Math.floor((this.#accumulator + EPSILON) / this.step);
    this.#accumulator = Math.max(0, this.#accumulator - steps * this.step);
    return steps;
  }

  /** How far (0..1) real time is into the next step: useful to interpolate rendering. */
  get alpha(): number {
    return this.#accumulator / this.step;
  }

  reset(): void {
    this.#accumulator = 0;
  }
}
