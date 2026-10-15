import { describe, expect, it } from 'vitest';
import { decodeWaveforms, WAVE_LENGTH } from './waveforms';

describe('decodeWaveforms', () => {
  it('splits the PROM into waveforms of 32 samples, keeping the low nibble', () => {
    const prom = Array.from({ length: 64 }, (_, i) => 0xf0 | (i % 16));
    const waves = decodeWaveforms(prom);
    expect(waves).toHaveLength(2);
    expect(waves[0]).toHaveLength(WAVE_LENGTH);
    expect(waves[1]?.[17]).toBe(1);
  });
});
