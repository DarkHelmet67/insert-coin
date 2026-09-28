import { endTime, SILENCE, whiteNoise, type NoiseSound, type Sound, type ToneSound } from './sound';

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

/** A gain node that starts at `volume` and fades to silence by the end of the sound. */
const fadingGain = (ctx: SynthContext, sound: Sound, start: number): GainNode => {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(sound.volume, start);
  gain.gain.exponentialRampToValueAtTime(SILENCE, endTime(sound, start));
  gain.connect(ctx.destination);
  return gain;
};

/** Plays a tone: oscillator → fading gain → speakers. */
const playTone = (ctx: SynthContext, sound: ToneSound, start: number): void => {
  const oscillator = ctx.createOscillator();
  oscillator.type = sound.wave;
  oscillator.frequency.setValueAtTime(sound.from, start);
  oscillator.frequency.exponentialRampToValueAtTime(sound.to, endTime(sound, start));
  oscillator.connect(fadingGain(ctx, sound, start));
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
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(sound.cutoff, start);

  source.connect(filter);
  filter.connect(fadingGain(ctx, sound, start));
  source.start(start);
};

/**
 * Plays `sound` right now.
 * Web Audio nodes are single-use and are garbage collected once they finish, so every call
 * builds a fresh small graph of nodes.
 */
export const playSound = (ctx: SynthContext, sound: Sound): void => {
  const start = ctx.currentTime;
  if (sound.kind === 'tone') playTone(ctx, sound, start);
  else playNoise(ctx, sound, start);
};
