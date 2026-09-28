/**
 * A tone: an oscillator whose pitch slides from `from` to `to` hertz while its volume fades out.
 * Most 1970s arcade effects are simple sweeps like this one.
 */
export interface ToneSound {
  readonly kind: 'tone';
  readonly wave: OscillatorType;
  /** Starting and ending frequency, in hertz. */
  readonly from: number;
  readonly to: number;
  /** Length in seconds. */
  readonly duration: number;
  /** Starting volume, from 0 to 1. */
  readonly volume: number;
}

/** A noise burst: random samples through a low-pass filter, for explosions and shots. */
export interface NoiseSound {
  readonly kind: 'noise';
  /** Filter cut-off in hertz: lower sounds duller, like a distant rumble. */
  readonly cutoff: number;
  readonly duration: number;
  readonly volume: number;
}

/** A sound effect described as plain data: easy to read, tweak and test. */
export type Sound = ToneSound | NoiseSound;

/**
 * The quietest volume used at the end of a fade.
 * Exponential ramps (which sound natural to the ear) cannot reach exactly zero.
 */
export const SILENCE = 0.0001;

/** When a sound started at `start` ends, in the audio clock's seconds. */
export const endTime = (sound: Sound, start: number): number => start + sound.duration;

/**
 * Generates white noise: `length` random samples between -1 and 1.
 * The random source is a parameter so tests can use a predictable one.
 */
export const whiteNoise = (
  length: number,
  random: () => number = Math.random,
): Float32Array<ArrayBuffer> => Float32Array.from({ length }, () => random() * 2 - 1);
