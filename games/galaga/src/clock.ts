/*
 * The clocks of the cabinet (`jp_0513_rst38`, `f_1DD2`). Everything is counted in frames: the
 * frame counter, a slow clock derived from it, and four game timers that tick about twice a
 * second, which the main program uses for its pauses.
 */

/**
 * `ds3_92A0_frame_cts[2]`, the "4 Hz" clock: it steps on frames 0 and 1 of every 32, so it is
 * odd except on one frame in 32, and its bit 1 changes every 32 frames.
 */
export const slowClock = (frame: number): number =>
  frame <= 0 ? 0 : (frame >> 5) * 2 + ((frame & 0x1f) >= 1 ? 1 : 0);

/** `f_1DD2`: the game timers tick on the one frame in 32 where the slow clock is even. */
export const timersTick = (frame: number): boolean => frame > 0 && (frame & 0x1f) === 0;

/** The four game timers (`ds4_game_tmrs`), each counting down to 0. */
export type GameTimers = readonly [number, number, number, number];

/** Timers all at 0. */
export const NO_TIMERS: GameTimers = [0, 0, 0, 0];

/** The timers one frame later. */
export const tickTimers = (timers: GameTimers, frame: number): GameTimers =>
  timersTick(frame)
    ? [
        Math.max(timers[0] - 1, 0),
        Math.max(timers[1] - 1, 0),
        Math.max(timers[2] - 1, 0),
        Math.max(timers[3] - 1, 0),
      ]
    : timers;

/** The timers with timer `index` set to `value`. */
export const setTimer = (timers: GameTimers, index: 0 | 1 | 2 | 3, value: number): GameTimers => [
  index === 0 ? value : timers[0],
  index === 1 ? value : timers[1],
  index === 2 ? value : timers[2],
  index === 3 ? value : timers[3],
];
