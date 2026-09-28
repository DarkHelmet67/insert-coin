import {
  endTime,
  fadeStart,
  layersOf,
  SILENCE,
  whiteNoise,
  type NoiseSound,
  type Sound,
  type SoundEffect,
  type ToneSound,
} from './sound';

/**
 * The parts of the Web Audio `AudioContext` the synthesizer uses.
 * Declaring them explicitly lets tests pass a small recording fake.
 */
export type SynthContext = Pick<
  AudioContext,
  | 'currentTime'
  | 'sampleRate'
  | 'destination'
  | 'createOscillator'
  | 'createGain'
  | 'createBuffer'
  | 'createBufferSource'
  | 'createBiquadFilter'
>;

/** A gain node that holds `volume`, then fades to silence by the end of the sound. */
const fadingGain = (ctx: SynthContext, sound: Sound, start: number): GainNode => {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(sound.volume, start);
  // A second point at the same volume keeps it steady until the fade begins.
  if (sound.hold) gain.gain.setValueAtTime(sound.volume, fadeStart(sound, start));
  if (sound.fade === 'linear') gain.gain.linearRampToValueAtTime(0, endTime(sound, start));
  else gain.gain.exponentialRampToValueAtTime(SILENCE, endTime(sound, start));
  gain.connect(ctx.destination);
  return gain;
};

/** A low-pass filter feeding `output`. */
const lowPass = (ctx: SynthContext, cutoff: number, start: number, output: AudioNode) => {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(cutoff, start);
  filter.connect(output);
  return filter;
};

/** Plays a tone: oscillator → optional low-pass filter → fading gain → speakers. */
const playTone = (ctx: SynthContext, sound: ToneSound, start: number): void => {
  const oscillator = ctx.createOscillator();
  oscillator.type = sound.wave;
  oscillator.frequency.setValueAtTime(sound.from, start);
  if (sound.sweep === 'linear') {
    oscillator.frequency.linearRampToValueAtTime(sound.to, endTime(sound, start));
  } else {
    oscillator.frequency.exponentialRampToValueAtTime(sound.to, endTime(sound, start));
  }
  const gain = fadingGain(ctx, sound, start);
  oscillator.connect(sound.cutoff === undefined ? gain : lowPass(ctx, sound.cutoff, start, gain));
  oscillator.start(start);
  oscillator.stop(endTime(sound, start));
};

/** Plays a noise burst: noise buffer → low-pass filter → fading gain → speakers. */
const playNoise = (ctx: SynthContext, sound: NoiseSound, start: number): void => {
  const length = Math.ceil(sound.duration * ctx.sampleRate);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  buffer.copyToChannel(whiteNoise(length), 0);

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(lowPass(ctx, sound.cutoff, start, fadingGain(ctx, sound, start)));
  source.start(start);
};

/**
 * Plays `sound` now, or after its `delay`.
 * Web Audio nodes are single-use and are garbage collected once they finish, so every call
 * builds a fresh small graph of nodes.
 */
export const playSound = (ctx: SynthContext, sound: Sound): void => {
  const start = ctx.currentTime + (sound.delay ?? 0);
  if (sound.kind === 'tone') playTone(ctx, sound, start);
  else playNoise(ctx, sound, start);
};

/** Plays every layer of a sound effect; the audio clock keeps their delays exact. */
export const playEffect = (ctx: SynthContext, effect: SoundEffect): void => {
  layersOf(effect).forEach((sound) => {
    playSound(ctx, sound);
  });
};
