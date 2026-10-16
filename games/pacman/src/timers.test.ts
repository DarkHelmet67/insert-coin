import { describe, expect, it } from 'vitest';
import { DELAY, tickTimer, timerDone, timerOf, unitTicks } from './timers';

/** The timer after `frames` frames from power-on frame `first`. */
const run = (code: number, first: number, frames: number) =>
  Array.from({ length: frames }, (_, i) => first + i).reduce(tickTimer, timerOf(code));

describe('timers', () => {
  it('reads unit and count from the code byte', () => {
    expect(timerOf(DELAY.pause)).toEqual({ unit: 1, count: 20 });
    expect(timerOf(DELAY.fruit)).toEqual({ unit: 2, count: 10 });
  });

  it('counts tenths of a second on the machine clock', () => {
    expect(unitTicks(1, 12)).toBe(true);
    expect(unitTicks(1, 13)).toBe(false);
    expect(timerDone(run(DELAY.pause, 0, 115))).toBe(true);
    expect(timerDone(run(DELAY.pause, 1, 115))).toBe(false);
    expect(timerDone(run(DELAY.pause, 1, 120))).toBe(true);
  });

  it('counts frames one by one', () => {
    expect(timerDone(run(0x05, 7, 4))).toBe(false);
    expect(timerDone(run(0x05, 7, 5))).toBe(true);
  });
});
