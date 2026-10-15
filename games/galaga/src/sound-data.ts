/*
 * Reading the data of the sound program (`gg1-7.s`), as the sound processor does: the note
 * table, the effect table, the tracks and their tempos. Addresses are those of the ROM used
 * (3700g.bin); the labels of the source, written on another set, are $27 lower.
 */
import { SOUND_DATA, SOUND_DATA_ADDRESS } from './rom/sound-rom';

/** `d_06A9_ndat`: the pitch of the 12 notes of the top octave, then a rest (0). */
const NOTE_TABLE = 0x06d0;
/** `d_06C3`: the 8 steps and 8 start pitches of the pulsing sound, opening and closing. */
export const PULSE_OPENING = 0x06ea;
export const PULSE_CLOSING = 0x06fa;
/** `d_0703_snd_parms`: 3 bytes for each effect: first track, tracks, first voice. */
const EFFECT_TABLE = 0x072a;
/** `d_0748_p_snd_fx`: the address of each track. */
const TRACK_TABLE = 0x076f;
/** `d_07A6`: the length of a beat of each effect, in sound ticks (1/120 s). */
const TEMPO_TABLE = 0x07cd;

/** A note byte that silences the voice, and the one that ends a track. */
export const REST = 0x0c;
export const END = 0xff;

/** A byte of the sound ROM; outside the data, the ROM is blank ($FF). */
export const soundByte = (address: number): number =>
  SOUND_DATA[address - SOUND_DATA_ADDRESS] ?? 0xff;

/** A 16-bit word, low byte first. */
const soundWord = (address: number): number => soundByte(address) | (soundByte(address + 1) << 8);

/** The tracks an effect plays, one per voice. */
export interface EffectTracks {
  readonly first: number;
  readonly count: number;
  /** The voice of the first track; the next tracks take the next voices. */
  readonly voice: number;
}

/** The tracks of `effect`, as the effect table lists them. */
export const effectTracks = (effect: number): EffectTracks => {
  const address = EFFECT_TABLE + effect * 3;
  return {
    first: soundByte(address),
    count: soundByte(address + 1),
    voice: soundByte(address + 2),
  };
};

/** The 3 bytes that open a track, before its notes. */
export interface TrackHeader {
  /** How the volume of each note moves: 0 steady then fading, 1 rising, 2 or more falling. */
  readonly envelope: number;
  /** Ticks at full volume before the fade; 0 holds the note at full volume. */
  readonly hold: number;
  readonly waveform: number;
  /** Address of the notes: pairs of a note byte and a length in beats. */
  readonly notes: number;
}

/** The header of `track`. */
export const trackHeader = (track: number): TrackHeader => {
  const address = soundWord(TRACK_TABLE + track * 2);
  return {
    envelope: soundByte(address),
    hold: soundByte(address + 1),
    waveform: soundByte(address + 2),
    notes: address + 3,
  };
};

/** The beat of `effect`, in ticks. */
export const tempo = (effect: number): number => soundByte(TEMPO_TABLE + effect);

/**
 * `l_05A7`: the 16-bit pitch of a note byte. The low nibble is the note in the top octave,
 * the high nibble how many octaves lower: each halves the pitch.
 */
export const notePitch = (note: number): number =>
  soundWord(NOTE_TABLE + (note & 0x0f) * 2) >> (note >> 4);

/** One part of the pulsing sound: a sliding pitch. */
export interface PulseSegment {
  readonly step: number;
  readonly start: number;
}

/** Segment `segment` of the pulsing table at `table`: the start pitches follow the steps. */
export const pulseSegment = (table: number, segment: number): PulseSegment => {
  const address = table + segment * 2;
  return { step: soundWord(address), start: soundWord(address + 0x20) };
};
