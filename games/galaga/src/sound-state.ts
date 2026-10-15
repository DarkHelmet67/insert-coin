/*
 * The memory of the sound processor (`b_9A00`-`b_9AD6` in `gg1-7.s`): the trigger registers
 * the main processor writes, which effects are playing, the tracks and the few counters of the
 * effects that do more than play notes.
 */
import type { Mix, Tracks } from './sound-tracks';

/** Effects in the program: $00 to $16. */
export const EFFECT_COUNT = 0x17;

/** Tracks in the program: $00 to $2E. */
const TRACK_COUNT = 0x2f;

/** The effects by name (`b_9AA0[n]`). */
export const EFFECT = {
  pulse: 0x00,
  bossHit: 0x01,
  butterflyHit: 0x02,
  beeHit: 0x03,
  bossDamaged: 0x04,
  tractorBeam: 0x05,
  beamCapture: 0x06,
  capturedFighterHit: 0x07,
  coin: 0x08,
  fighterCaptured: 0x09,
  extraLife: 0x0a,
  startTheme: 0x0b,
  nameEntry: 0x0c,
  challengeStart: 0x0d,
  challengeEnd: 0x0e,
  shot: 0x0f,
  unused: 0x10,
  rescue: 0x11,
  bonusBee: 0x12,
  dive: 0x13,
  perfect: 0x14,
  badge: 0x15,
  nameEntryEnd: 0x16,
} as const;

/** The pulsing sound of the breathing formation (`b_9A80`-`b_9A87`). */
export interface Pulse {
  /** The direction of the formation it was started for: 1 opening, $FF closing. */
  readonly sign: number;
  /** Address of the table in use, and the segment of it. */
  readonly table: number;
  readonly segment: number;
  /** The pitch, and how much it changes at every tick, in 16 bits. */
  readonly pitch: number;
  readonly step: number;
}

/** The sound processor's memory. */
export interface SoundState {
  /** The trigger registers written by the main processor (`b_9AA0`). */
  readonly triggers: readonly number[];
  /** Which effects are playing (`b_9AC0`). */
  readonly playing: readonly boolean[];
  readonly tracks: Tracks;
  /** The waveform of each voice (`b_9A70`): it stays from one tick to the next. */
  readonly waveforms: readonly number[];
  readonly pulse: Pulse;
  /** Volume and tick counter of the third voice's tremolo in the tractor beam (`b_9A7C`, `$7E`). */
  readonly beamVolume: number;
  readonly beamTicks: number;
  /** Waveform and tick counter of the fighter being pulled up the beam (`b_9A7D`, `$7F`). */
  readonly pullWaveform: number;
  readonly pullTicks: number;
}

/** The memory cleared at power-on (`l_00A2`). */
export const newSoundState = (): SoundState => ({
  triggers: Array.from({ length: EFFECT_COUNT }, () => 0),
  playing: Array.from({ length: EFFECT_COUNT }, () => false),
  tracks: {
    ticks: Array.from({ length: TRACK_COUNT }, () => 0),
    notes: Array.from({ length: TRACK_COUNT }, () => 0),
  },
  waveforms: [0, 0, 0],
  pulse: { sign: 0, table: 0, segment: 0, pitch: 0, step: 0 },
  beamVolume: 0,
  beamTicks: 0,
  pullWaveform: 0,
  pullTicks: 0,
});

/** What one tick works on: the memory and the voices being set up. */
export interface Work {
  readonly sound: SoundState;
  readonly mix: Mix;
}

/** The trigger register of `effect`. */
export const trigger = (work: Work, effect: number): number => work.sound.triggers[effect] ?? 0;

/** The memory changed by `change`. */
export const withSound = (work: Work, change: Partial<SoundState>): Work => ({
  ...work,
  sound: { ...work.sound, ...change },
});

/** The trigger register of `effect` set to `value` (one byte). */
export const setTrigger = (work: Work, effect: number, value: number): Work =>
  withSound(work, {
    triggers: work.sound.triggers.map((v, i) => (i === effect ? value & 0xff : v)),
  });

/** Whether `effect` is playing set to `playing`. */
export const setPlaying = (work: Work, effect: number, playing: boolean): Work =>
  withSound(work, { playing: work.sound.playing.map((v, i) => (i === effect ? playing : v)) });
