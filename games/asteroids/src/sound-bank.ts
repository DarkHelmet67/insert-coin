import type { Sound, SoundEffect } from '@arcade/audio';
import { tuning } from './tuning.config';

/** The sound effects of the game. */
export type SoundName =
  | 'thumpLow'
  | 'thumpHigh'
  | 'fire'
  | 'saucerFire'
  | 'thrust'
  | 'saucerLarge'
  | 'saucerSmall'
  | 'explosionLow'
  | 'explosionMid'
  | 'explosionHigh'
  | 'extraLife';

const { sound } = tuning;

/** Seconds of `frames` frames of the game. */
export const seconds = (frames: number): number => frames / tuning.framesPerSecond;

/** Frames between two pieces of the thrust noise, played one after the other. */
export const THRUST_CHUNK_FRAMES = 6;

/** Frames of one warble of each saucer: one piece of the siren is played every warble. */
export const SAUCER_WARBLE_FRAMES = {
  large: Math.round(tuning.framesPerSecond / sound.saucer.large.rate),
  small: Math.round(tuning.framesPerSecond / sound.saucer.small.rate),
} as const;

/** One beat of the heart: 4 frames of a low square wave, softened by a filter. */
const thumpNote = (frequency: number): Sound => ({
  kind: 'tone',
  wave: 'square',
  from: frequency,
  to: frequency,
  cutoff: sound.thump.cutoff,
  duration: seconds(5),
  hold: seconds(4),
  fade: 'linear',
  volume: sound.thump.volume,
});

/** A falling whistle, as the 555 oscillator of the shot circuits. */
const shotSound = (shot: {
  from: number;
  to: number;
  duration: number;
  volume: number;
}): Sound => ({
  kind: 'tone',
  wave: 'square',
  from: shot.from,
  to: shot.to,
  cutoff: 3000,
  duration: shot.duration,
  volume: shot.volume,
});

/** One warble of the siren: up and down again around the center frequency. */
const warble = (siren: { center: number; depth: number }, frames: number): SoundEffect => {
  const half = seconds(frames) / 2;
  /** Half a warble, from one frequency to the other. */
  const slide = (from: number, to: number, delay: number): Sound => ({
    kind: 'tone',
    wave: 'triangle',
    sweep: 'linear',
    from,
    to,
    delay,
    duration: half,
    hold: half,
    fade: 'linear',
    volume: sound.saucer.volume,
  });
  const low = siren.center - siren.depth;
  const high = siren.center + siren.depth;
  return [slide(low, high, 0), slide(high, low, half)];
};

/** An explosion: noise at one of the three clocks, fading in about a second. */
const explosion = (cutoff: number): Sound => ({
  kind: 'noise',
  cutoff,
  duration: sound.explosion.duration,
  fade: 'linear',
  volume: sound.explosion.volume,
});

/** The extra ship: short beeps, 4 frames on and 4 off. */
const extraLife: SoundEffect = Array.from({ length: sound.extraLife.beeps }, (_, beep) => ({
  kind: 'tone' as const,
  wave: 'square' as const,
  from: sound.extraLife.frequency,
  to: sound.extraLife.frequency,
  delay: seconds(8 * beep),
  duration: seconds(4),
  hold: seconds(4),
  fade: 'linear' as const,
  volume: sound.extraLife.volume,
}));

/**
 * The sound effects, synthesized in code in the spirit of the original analog board: no audio
 * files, a few numbers per sound, all in tuning.config.ts.
 */
export const sounds: Readonly<Record<SoundName, SoundEffect>> = {
  thumpLow: thumpNote(sound.thump.low),
  thumpHigh: thumpNote(sound.thump.high),
  fire: shotSound(sound.fire),
  saucerFire: shotSound(sound.saucerFire),
  // A little longer than the gap between two pieces, so the rumble has no holes.
  thrust: {
    kind: 'noise',
    cutoff: sound.thrust.cutoff,
    duration: seconds(THRUST_CHUNK_FRAMES + 2),
    hold: seconds(THRUST_CHUNK_FRAMES),
    fade: 'linear',
    volume: sound.thrust.volume,
  },
  saucerLarge: warble(sound.saucer.large, SAUCER_WARBLE_FRAMES.large),
  saucerSmall: warble(sound.saucer.small, SAUCER_WARBLE_FRAMES.small),
  explosionLow: explosion(sound.explosion.low),
  explosionMid: explosion(sound.explosion.mid),
  explosionHigh: explosion(sound.explosion.high),
  extraLife,
};
