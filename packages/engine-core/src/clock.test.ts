import { describe, expect, it } from 'vitest';
import { FixedStepClock } from './clock';

describe('FixedStepClock', () => {
  it('runs one step per step of elapsed time', () => {
    const clock = new FixedStepClock({ step: 1 / 60 });
    expect(clock.advance(1 / 60)).toBe(1);
    expect(clock.advance(1 / 60)).toBe(1);
  });

  it('accumulates short frames until a whole step has passed', () => {
    const clock = new FixedStepClock({ step: 0.1 });
    expect(clock.advance(0.04)).toBe(0);
    expect(clock.advance(0.04)).toBe(0);
    expect(clock.advance(0.04)).toBe(1);
    expect(clock.alpha).toBeCloseTo(0.2);
  });

  it('runs several steps after a long frame', () => {
    const clock = new FixedStepClock({ step: 0.01 });
    expect(clock.advance(0.035)).toBe(3);
  });

  it('clamps very long pauses to avoid a burst of updates', () => {
    const clock = new FixedStepClock({ step: 0.01, maxFrameTime: 0.1 });
    expect(clock.advance(5)).toBe(10);
  });

  it('ignores negative elapsed time', () => {
    const clock = new FixedStepClock({ step: 0.01 });
    expect(clock.advance(-1)).toBe(0);
    expect(clock.alpha).toBe(0);
  });

  it('keeps the step count exact over many 60 Hz frames', () => {
    const clock = new FixedStepClock({ step: 1 / 60 });
    let steps = 0;
    for (let i = 0; i < 6000; i++) steps += clock.advance(1 / 60);
    expect(steps).toBe(6000);
  });
});
