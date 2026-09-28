import { describe, expect, it } from 'vitest';
import { endTime, whiteNoise, type Sound } from './sound';

const beep: Sound = {
  kind: 'tone',
  wave: 'square',
  from: 440,
  to: 220,
  duration: 0.2,
  volume: 0.5,
};

describe('endTime', () => {
  it('adds the duration to the start time', () => {
    expect(endTime(beep, 1)).toBeCloseTo(1.2);
  });
});

describe('whiteNoise', () => {
  it('maps random numbers from 0..1 to samples from -1..1', () => {
    const values = [0, 0.5, 0.75];
    const noise = whiteNoise(3, () => values.shift() ?? 0);
    expect([...noise]).toEqual([-1, 0, 0.5]);
  });

  it('has the requested length', () => {
    expect(whiteNoise(100)).toHaveLength(100);
  });
});
