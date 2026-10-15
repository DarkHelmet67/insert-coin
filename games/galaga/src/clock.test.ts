import { describe, expect, it } from 'vitest';
import { NO_TIMERS, setTimer, slowClock, tickTimers } from './clock';

describe('clocks', () => {
  it('steps the slow clock twice every 32 frames', () => {
    expect([1, 31, 32, 33, 64].map(slowClock)).toEqual([1, 1, 2, 3, 4]);
  });

  it('ticks the game timers once every 32 frames, down to 0', () => {
    const timers = setTimer(NO_TIMERS, 3, 1);
    expect(tickTimers(timers, 31)).toEqual(timers);
    expect(tickTimers(timers, 32)).toEqual(NO_TIMERS);
    expect(tickTimers(NO_TIMERS, 64)).toEqual(NO_TIMERS);
  });
});
