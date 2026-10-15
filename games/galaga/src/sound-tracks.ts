/*
 * `c_0550` (at $0577 in this ROM): one tick of one track of an effect. The track plays its
 * notes one after the other on one voice: each note is a pitch and a length in beats, and its
 * volume follows the envelope written in the track's header.
 */
import {
  END,
  notePitch,
  REST,
  soundByte,
  tempo,
  trackHeader,
  type TrackHeader,
} from './sound-data';

/** What the sound processor keeps about its tracks (`b_9A00`, `b_9A30`). */
export interface Tracks {
  /** Ticks played of the current note of each track. */
  readonly ticks: readonly number[];
  /** Where each track is in its notes, in bytes (2 per note). */
  readonly notes: readonly number[];
}

/** What the effects ask of the three voices in one tick (`b_9A60`, `b_9A70`). */
export interface Mix {
  /** 20-bit frequency of each voice; cleared at every tick. */
  readonly frequencies: readonly number[];
  /** Volume of each voice, in the low 4 bits; cleared at every tick. */
  readonly volumes: readonly number[];
  /** Waveform of each voice: it stays until an effect changes it. */
  readonly waveforms: readonly number[];
}

/** One tick of a track. */
export interface TrackTick {
  readonly tracks: Tracks;
  readonly mix: Mix;
  /** The track has run out of notes (`b_9A70[8]`). */
  readonly ended: boolean;
}

/** `list` with `value` at `index`. */
export const setAt = (list: readonly number[], index: number, value: number): readonly number[] =>
  list.map((v, i) => (i === index ? value : v));

/**
 * `l_0603`-`l_0654`: the volume of a note `tick` ticks after it started. Envelope 0 holds
 * volume 10, then fades by one a tick; 1 rises from 2 to 10 first; 2 and above start at 14 and
 * fall to 10 first. The voices only read the low 4 bits.
 */
export const envelopeVolume = (header: TrackHeader, tick: number): number => {
  if (header.envelope === 1 && tick < 6) return tick * 2;
  if (header.envelope >= 2 && tick < 6) return ~tick & 0x0f;
  if (header.hold === 0 || tick < header.hold) return 0x0a;
  const fading = tick - header.hold;
  return fading >= 0x0a ? 0 : 0x0a - fading;
};

/** One tick of `track` of `effect`, played on `voice`. */
export const playTrack = (
  tracks: Tracks,
  mix: Mix,
  effect: number,
  track: number,
  voice: number,
): TrackTick => {
  const tick = ((tracks.ticks[track] ?? 0) + 1) & 0xff;
  const counted = { ...tracks, ticks: setAt(tracks.ticks, track, tick) };
  const header = trackHeader(track);
  const address = header.notes + (tracks.notes[track] ?? 0);
  const note = soundByte(address);
  if (note === END) {
    // `l_06B2`: a finished track keeps its voice silent.
    return { tracks: counted, mix: { ...mix, volumes: setAt(mix.volumes, voice, 0) }, ended: true };
  }
  const played: Mix = {
    frequencies: setAt(mix.frequencies, voice, notePitch(note) * 16),
    volumes: setAt(mix.volumes, voice, note === REST ? 0 : envelopeVolume(header, tick)),
    waveforms: setAt(mix.waveforms, voice, header.waveform),
  };
  // The length of a note is its beats times the tempo, in one byte (`l_0661`).
  const length = (tempo(effect) * soundByte(address + 1)) & 0xff;
  if (tick !== length) return { tracks: counted, mix: played, ended: false };
  return {
    tracks: {
      ticks: setAt(counted.ticks, track, 0),
      notes: setAt(tracks.notes, track, ((tracks.notes[track] ?? 0) + 2) & 0xff),
    },
    mix: played,
    ended: false,
  };
};
