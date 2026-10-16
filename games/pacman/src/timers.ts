/**
 * A timed task of the program (list at $4C90, routine $0221): a count and its unit. Its code
 * byte keeps the unit in the top 2 bits and the count in the other 6, so $54 is 20 tenths of
 * a second.
 */
export interface Timer {
  /** 0: frames, 1: tenths of a second, 2: seconds, 3: tens of seconds. */
  readonly unit: number;
  readonly count: number;
}

/** A timer from its code byte, as the program writes it after `rst $30`. */
export const timerOf = (code: number): Timer => ({ unit: code >> 6, count: code & 0x3f });

/** Frames in each unit: the interrupt counts frames by 6, then by 10, then by 10 ($01E3). */
const UNIT_FRAMES = [1, 6, 60, 600] as const;

/**
 * Whether a timer of `unit` counts down at power-on frame `frame`. The units are not started
 * with the timer but follow one clock for the whole machine, so a timer of 2 seconds lasts
 * between 1.9 and 2 seconds: the first tenth is already under way.
 */
export const unitTicks = (unit: number, frame: number): boolean =>
  frame % (UNIT_FRAMES[unit] ?? 1) === 0;

/** The timer after frame `frame`. */
export const tickTimer = (timer: Timer, frame: number): Timer =>
  timer.count > 0 && unitTicks(timer.unit, frame) ? { ...timer, count: timer.count - 1 } : timer;

/** Whether the timer has run out. */
export const timerDone = (timer: Timer): boolean => timer.count === 0;

/** The timed tasks the game uses, by their code bytes. */
export const DELAY = {
  /** The "READY!" and the pauses of the game flow: 2 seconds. */
  pause: 0x54,
  /** The start of a game, before the actors show up: 2.3 seconds. */
  start: 0x57,
  /** One flash of the maze at the end of a level: 0.2 seconds. */
  flash: 0x42,
  /** The empty screen after the flashes: 0.3 seconds. */
  cleared: 0x43,
  /** How long a fruit stays: 10 seconds. */
  fruit: 0x8a,
  /** The waits of the attract mode and of the intermissions. */
  second: 0x4a,
  halfSecond: 0x45,
} as const;
