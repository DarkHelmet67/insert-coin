import { describe, expect, it } from 'vitest';
import { QUIET_SPEAKER, throughSpeaker } from './speaker';

describe('the speaker', () => {
  it('lets a steady level fade to silence', () => {
    const steady = Float32Array.from({ length: 48000 }, () => 0.5);
    const { samples } = throughSpeaker(QUIET_SPEAKER, steady);
    expect(samples[0]).toBeCloseTo(0.5);
    expect(Math.abs(samples[47999] ?? 1)).toBeLessThan(0.001);
  });

  it('lets a tone through', () => {
    const tone = Float32Array.from({ length: 4800 }, (_, i) => Math.sin((i * 2 * Math.PI) / 48));
    const { samples } = throughSpeaker(QUIET_SPEAKER, tone);
    expect(Math.max(...samples.slice(2400))).toBeGreaterThan(0.95);
  });
});
