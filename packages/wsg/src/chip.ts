import type { WsgVoice } from './voices';
import { WAVE_LENGTH, type Waveform } from './waveforms';

/**
 * Samples a second made by the chip: the 18.432 MHz clock of the board divided by 6 and by
 * 32 (MAME `galaga.cpp`, `pacman.cpp`).
 */
export const CHIP_RATE = 96000;

/** The voice counters are 20 bits: the top 5 bits pick the sample of the waveform. */
const COUNTER_SIZE = 2 ** 20;
const SAMPLE_SIZE = COUNTER_SIZE / WAVE_LENGTH;

/** The loudest output of the three voices: samples from -8 to 7 at volume 15. */
const FULL_SCALE = 8 * 15 * 3;

/** The chip between two calls: where each voice is in its waveform. */
export interface WsgChip {
  readonly counters: readonly number[];
}

/** The chip at power-on. */
export const newChip = (): WsgChip => ({ counters: [0, 0, 0] });

/** The sound a chip makes, and the chip after it. */
export interface Rendered {
  readonly chip: WsgChip;
  /** Samples from -1 to 1 at the requested rate. */
  readonly samples: Float32Array<ArrayBuffer>;
}

/**
 * Value of one voice at chip sample `step`: the counter grows by the frequency at every
 * sample, so it is computed directly instead of step by step.
 */
const voiceAt = (
  voice: WsgVoice,
  counter: number,
  waveforms: readonly Waveform[],
  step: number,
): number => {
  if (voice.volume === 0) return 0;
  const position = (counter + voice.frequency * step) % COUNTER_SIZE;
  const sample = waveforms[voice.waveform & 7]?.[Math.floor(position / SAMPLE_SIZE)] ?? 8;
  return (sample - 8) * voice.volume;
};

/**
 * Plays `voices` for `count` samples at `rate` hertz, which must divide `CHIP_RATE` (48000
 * does). Each output sample is the average of the chip samples it covers, a simple filter
 * against the harsh notes that skipping samples would add.
 * @throws when `rate` does not divide the chip rate.
 */
export const renderChip = (
  chip: WsgChip,
  voices: readonly WsgVoice[],
  waveforms: readonly Waveform[],
  count: number,
  rate: number,
): Rendered => {
  const steps = CHIP_RATE / rate;
  if (!Number.isInteger(steps)) throw new Error(`${String(rate)} Hz does not divide the chip rate`);
  const counters = voices.map((_, i) => chip.counters[i] ?? 0);
  /** The mixed output at chip sample `step`. */
  const mixAt = (step: number): number =>
    voices.reduce((sum, voice, i) => sum + voiceAt(voice, counters[i] ?? 0, waveforms, step), 0);
  const samples = Float32Array.from({ length: count }, (_, i) => {
    const first = i * steps;
    const total = Array.from({ length: steps }, (_, k) => mixAt(first + k)).reduce(
      (a, b) => a + b,
      0,
    );
    return total / steps / FULL_SCALE;
  });
  return {
    chip: {
      counters: voices.map(
        (voice, i) => ((counters[i] ?? 0) + voice.frequency * count * steps) % COUNTER_SIZE,
      ),
    },
    samples,
  };
};

/** The pitch in hertz of a voice frequency value. */
export const frequencyToHertz = (frequency: number): number =>
  (frequency * CHIP_RATE) / COUNTER_SIZE;
