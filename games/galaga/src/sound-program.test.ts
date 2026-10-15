import { describe, expect, it } from 'vitest';
import { effectTracks, notePitch, PULSE_OPENING, pulseSegment, REST, tempo } from './sound-data';
import { tickSound } from './sound-program';
import { EFFECT, newSoundState, type SoundState } from './sound-state';
import { envelopeVolume } from './sound-tracks';

/** The memory with `effect` triggered by the main processor. */
const triggered = (effect: number, sound = newSoundState()): SoundState => ({
  ...sound,
  triggers: sound.triggers.map((v, i) => (i === effect ? 1 : v)),
});

/** Ticks the program `count` times, keeping every tick. */
const run = (sound: SoundState, count: number, sign = 1) =>
  Array.from({ length: count }).reduce<ReturnType<typeof tickSound>[]>((ticks) => {
    const last = ticks.at(-1)?.sound ?? sound;
    return [...ticks, tickSound(last, sign)];
  }, []);

describe('the sound data', () => {
  it('reads the effect table: the start theme plays three tracks from the first voice', () => {
    expect(effectTracks(EFFECT.startTheme)).toEqual({ first: 0x13, count: 3, voice: 0 });
    expect(effectTracks(EFFECT.shot)).toEqual({ first: 0x1f, count: 1, voice: 2 });
    expect(tempo(EFFECT.startTheme)).toBe(4);
  });

  it('halves the pitch for each octave down, and a rest has no pitch', () => {
    expect(notePitch(0x00)).toBe(0x8150);
    expect(notePitch(0x10)).toBe(0x8150 >> 1);
    expect(notePitch(0x71)).toBe(0x8900 >> 7);
    expect(notePitch(REST)).toBe(0);
  });

  it('reads the pulsing tables: a step and a start pitch per segment', () => {
    expect(pulseSegment(PULSE_OPENING, 0)).toEqual({ step: 0x0130, start: 0x5b00 });
  });
});

describe('envelopeVolume', () => {
  const header = { envelope: 0, hold: 3, waveform: 0, notes: 0 };
  it('holds volume 10, then fades by one a tick', () => {
    expect([1, 2, 3, 4, 12, 13, 14].map((t) => envelopeVolume(header, t))).toEqual([
      10, 10, 10, 9, 1, 0, 0,
    ]);
  });

  it('rises first with envelope 1, falls from 14 with envelope 2', () => {
    expect([1, 5].map((t) => envelopeVolume({ ...header, envelope: 1 }, t))).toEqual([2, 10]);
    expect([1, 5].map((t) => envelopeVolume({ ...header, envelope: 2 }, t))).toEqual([14, 10]);
  });

  it('never fades with a hold of 0', () => {
    expect(envelopeVolume({ ...header, hold: 0 }, 200)).toBe(10);
  });
});

describe('tickSound', () => {
  it('is silent with no trigger', () => {
    expect(tickSound(newSoundState(), 1).voices.every((v) => v.volume === 0)).toBe(true);
  });

  it('plays the shot on the third voice and clears its trigger at once', () => {
    const [first] = run(triggered(EFFECT.shot), 1);
    expect(first?.voices[2]?.volume).toBeGreaterThan(0);
    expect(first?.sound.triggers[EFFECT.shot]).toBe(0);
    expect(first?.sound.playing[EFFECT.shot]).toBe(true);
  });

  it('plays a tune to its end, then clears its trigger', () => {
    const ticks = run(triggered(EFFECT.startTheme), 1000);
    const end = ticks.findIndex((t) => t.sound.triggers[EFFECT.startTheme] === 0);
    // About seven seconds, at 120 ticks a second.
    expect(end).toBeGreaterThan(750);
    expect(end).toBeLessThan(900);
    expect(ticks[end + 1]?.voices.every((v) => v.volume === 0)).toBe(true);
  });

  it('loops a held effect while its register is set', () => {
    const ticks = run(triggered(EFFECT.tractorBeam), 1000);
    expect(ticks.slice(-100).some((t) => t.voices.some((v) => v.volume > 0))).toBe(true);
    // The third voice trembles between volumes 3 and 12.
    const volumes = ticks.slice(10).map((t) => t.voices[2]?.volume ?? 0);
    expect(Math.min(...volumes)).toBe(3);
    expect(Math.max(...volumes)).toBe(12);
  });

  it('gives a later effect the voice it shares with an earlier one', () => {
    // The bee and the Boss both use the second voice; the Boss comes later in the list.
    const both = triggered(EFFECT.bossHit, triggered(EFFECT.beeHit));
    const [first] = run(both, 1);
    const [alone] = run(triggered(EFFECT.bossHit), 1);
    expect(first?.voices[1]).toEqual(alone?.voices[1]);
  });

  it('slides the pulsing sound up while the formation opens', () => {
    const ticks = run(triggered(EFFECT.pulse), 30, 1);
    const pitches = ticks.map((t) => t.voices[0]?.frequency ?? 0);
    expect(pitches.at(-1)).toBeGreaterThan(pitches[0] ?? 0);
    const closing = run(triggered(EFFECT.pulse), 30, 0xff).map((t) => t.voices[0]?.frequency ?? 0);
    expect(closing.at(-1)).toBeLessThan(closing[0] ?? 0);
  });

  it('starts the round of the challenge results one track at a time', () => {
    const ticks = run(triggered(EFFECT.challengeEnd), 300);
    /** Voices with a pitch in a tick. */
    const voices = (t: (typeof ticks)[number] | undefined) =>
      t?.voices.filter((v) => v.frequency > 0).length;
    expect(voices(ticks[0])).toBe(1);
    expect(voices(ticks.at(-1))).toBe(3);
  });

  it('clears the other sounds at the end of "shot your ship!", but not the extra fighter', () => {
    const sound = triggered(
      EFFECT.extraLife,
      triggered(EFFECT.capturedFighterHit, triggered(EFFECT.rescue)),
    );
    const end = run(sound, 600).find((t) => t.sound.triggers[EFFECT.capturedFighterHit] === 0);
    expect(end?.sound.triggers[EFFECT.rescue]).toBe(0);
    expect(end?.sound.triggers[EFFECT.extraLife]).toBe(1);
  });
});
