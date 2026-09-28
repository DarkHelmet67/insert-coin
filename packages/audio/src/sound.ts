/** Timing and volume shared by every kind of sound. */
interface SoundEnvelope {
  /** Length in seconds, from the start to the end of the fade. */
  readonly duration: number;
  /** Starting volume, from 0 to 1. */
  readonly volume: number;
  /** Seconds at full volume before the fade starts; 0 (the default) fades from the start. */
  readonly hold?: number;
  /**
   * How the volume falls: `exponential` (the default) dies away quickly like a plucked string;
   * `linear` falls steadily, like the capacitors discharging in the original arcade circuits.
   */
  readonly fade?: 'exponential' | 'linear';
  /** Seconds to wait before starting, to line up the layers of a `SoundEffect`. */
  readonly delay?: number;
}

/**
 * A tone: an oscillator whose pitch slides from `from` to `to` hertz while its volume fades out.
 * Most 1970s arcade effects are simple sweeps like this one.
 */
export interface ToneSound extends SoundEnvelope {
  readonly kind: 'tone';
  readonly wave: OscillatorType;
  /** Starting and ending frequency, in hertz. */
  readonly from: number;
  readonly to: number;
  /**
   * How the pitch slides: `exponential` (the default) sounds even to the ear; `linear` changes by
   * the same hertz every second, like the analog circuits of the 1970s.
   */
  readonly sweep?: 'exponential' | 'linear';
  /** Optional low-pass filter cut-off in hertz, to soften bright waves. */
  readonly cutoff?: number;
}

/** A noise burst: random samples through a low-pass filter, for explosions and shots. */
export interface NoiseSound extends SoundEnvelope {
  readonly kind: 'noise';
  /** Filter cut-off in hertz: lower sounds duller, like a distant rumble. */
  readonly cutoff: number;
}

/** A single sound described as plain data: easy to read, tweak and test. */
export type Sound = ToneSound | NoiseSound;

/** A sound effect: one sound, or several layers played together, each after its own `delay`. */
export type SoundEffect = Sound | readonly Sound[];

/** The layers of an effect, as a list. */
export const layersOf = (effect: SoundEffect): readonly Sound[] =>
  Array.isArray(effect) ? effect : [effect as Sound];

/**
 * The quietest volume used at the end of a fade.
 * Exponential ramps (which sound natural to the ear) cannot reach exactly zero.
 */
export const SILENCE = 0.0001;

/** When a sound started at `start` ends, in the audio clock's seconds. */
export const endTime = (sound: Sound, start: number): number => start + sound.duration;

/** When the fade of a sound started at `start` begins: after its hold, never after its end. */
export const fadeStart = (sound: Sound, start: number): number =>
  start + Math.min(sound.hold ?? 0, sound.duration);

/**
 * Generates white noise: `length` random samples between -1 and 1.
 * The random source is a parameter so tests can use a predictable one.
 */
export const whiteNoise = (
  length: number,
  random: () => number = Math.random,
): Float32Array<ArrayBuffer> => Float32Array.from({ length }, () => random() * 2 - 1);
