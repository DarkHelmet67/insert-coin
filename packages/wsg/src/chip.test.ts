import { describe, expect, it } from 'vitest';
import { CHIP_RATE, frequencyToHertz, newChip, renderChip } from './chip';
import { SILENT_VOICES, type WsgVoice } from './voices';

/** A square wave: 16 samples high, 16 low. */
const SQUARE = [Array.from({ length: 32 }, (_, i) => (i < 16 ? 15 : 0))];

/** One voice playing the square wave, the others silent. */
const square = (frequency: number, volume = 15): readonly WsgVoice[] => [
  { frequency, volume, waveform: 0 },
  ...SILENT_VOICES.slice(1),
];

describe('frequencyToHertz', () => {
  it('turns a 20-bit step into a pitch: the counter wraps once per waveform', () => {
    expect(frequencyToHertz(2 ** 20 / CHIP_RATE)).toBeCloseTo(1);
    expect(frequencyToHertz(0x1020)).toBeCloseTo(378, 0);
  });
});

describe('renderChip', () => {
  it('is silent with silent voices', () => {
    const { samples } = renderChip(newChip(), SILENT_VOICES, SQUARE, 100, 48000);
    expect(samples.every((s) => s === 0)).toBe(true);
  });

  it('plays the waveform at the pitch of the frequency', () => {
    // 1000 Hz at 48 kHz: 48 samples per period, half of them high.
    const frequency = (1000 * 2 ** 20) / CHIP_RATE;
    const { samples } = renderChip(newChip(), square(frequency), SQUARE, 48, 48000);
    expect(samples.filter((s) => s > 0)).toHaveLength(24);
    expect(Math.max(...samples)).toBeCloseTo(7 / 24);
  });

  it('scales with the volume', () => {
    const loud = renderChip(newChip(), square(5000, 15), SQUARE, 10, 48000).samples;
    const soft = renderChip(newChip(), square(5000, 5), SQUARE, 10, 48000).samples;
    expect(soft[0]).toBeCloseTo((loud[0] ?? 0) / 3);
  });

  it('carries the counters over, so two calls make one unbroken wave', () => {
    const voices = square(7777);
    const whole = renderChip(newChip(), voices, SQUARE, 200, 48000).samples;
    const first = renderChip(newChip(), voices, SQUARE, 120, 48000);
    const second = renderChip(first.chip, voices, SQUARE, 80, 48000).samples;
    expect([...first.samples, ...second]).toEqual([...whole]);
  });

  it('refuses a rate that does not divide the chip rate', () => {
    expect(() => renderChip(newChip(), SILENT_VOICES, SQUARE, 1, 44100)).toThrow();
  });
});
