/** Samples in one waveform of the chip. */
export const WAVE_LENGTH = 32;

/** One waveform: 32 samples from 0 to 15, the middle being 8. */
export type Waveform = readonly number[];

/**
 * Decodes the waveform PROM (`prom-1.1d` in Galaga, `82s126.1m` in Pac-Man): every byte holds
 * one 4-bit sample in its low nibble, and every 32 bytes make a waveform.
 */
export const decodeWaveforms = (prom: readonly number[]): readonly Waveform[] =>
  Array.from({ length: Math.floor(prom.length / WAVE_LENGTH) }, (_, wave) =>
    prom.slice(wave * WAVE_LENGTH, (wave + 1) * WAVE_LENGTH).map((byte) => byte & 0x0f),
  );
