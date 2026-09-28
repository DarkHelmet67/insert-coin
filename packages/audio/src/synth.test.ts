import { describe, expect, it } from 'vitest';
import { SILENCE } from './sound';
import { playEffect, playSound } from './synth';
import { createRecordingAudioContext } from './test-audio-context';

describe('playSound', () => {
  it('plays a tone that slides in pitch and fades out', () => {
    const ctx = createRecordingAudioContext();
    playSound(ctx, {
      kind: 'tone',
      wave: 'square',
      from: 800,
      to: 100,
      duration: 0.3,
      volume: 0.4,
    });
    expect(ctx.calls).toEqual(
      expect.arrayContaining([
        ['frequency.set', 800, 0],
        ['frequency.ramp', 100, 0.3],
        ['gain.set', 0.4, 0],
        ['gain.ramp', SILENCE, 0.3],
        ['oscillator.start', 0],
        ['oscillator.stop', 0.3],
      ]),
    );
  });

  it('plays a filtered noise burst as long as the sound', () => {
    const ctx = createRecordingAudioContext();
    playSound(ctx, { kind: 'noise', cutoff: 2000, duration: 0.25, volume: 0.3 });
    expect(ctx.calls).toEqual(
      expect.arrayContaining([
        ['buffer', 250], // 0.25 s at the fake sample rate of 1000 Hz
        ['cutoff.set', 2000, 0],
        ['gain.ramp', SILENCE, 0.25],
        ['source.start', 0],
      ]),
    );
  });

  it('holds the volume, then slides pitch and volume linearly when asked', () => {
    const ctx = createRecordingAudioContext();
    playSound(ctx, {
      kind: 'tone',
      wave: 'triangle',
      from: 1800,
      to: 500,
      sweep: 'linear',
      duration: 0.2,
      hold: 0.1,
      fade: 'linear',
      volume: 0.5,
    });
    expect(ctx.calls).toEqual(
      expect.arrayContaining([
        ['frequency.linear', 500, 0.2],
        ['gain.set', 0.5, 0],
        ['gain.set', 0.5, 0.1],
        ['gain.linear', 0, 0.2],
      ]),
    );
  });

  it('filters a tone only when it has a cut-off', () => {
    const tone = {
      kind: 'tone',
      wave: 'sawtooth',
      from: 60,
      to: 60,
      duration: 0.1,
      volume: 1,
    } as const;
    const plain = createRecordingAudioContext();
    playSound(plain, tone);
    expect(plain.calls.some(([call]) => call === 'cutoff.set')).toBe(false);
    const filtered = createRecordingAudioContext();
    playSound(filtered, { ...tone, cutoff: 500 });
    expect(filtered.calls).toContainEqual(['cutoff.set', 500, 0]);
  });

  it('plays every layer of an effect after its own delay', () => {
    const ctx = createRecordingAudioContext();
    playEffect(ctx, [
      { kind: 'tone', wave: 'sine', from: 800, to: 400, duration: 0.05, volume: 0.3 },
      { kind: 'tone', wave: 'sine', from: 1800, to: 500, duration: 0.2, volume: 0.3, delay: 0.06 },
    ]);
    expect(ctx.calls).toEqual(
      expect.arrayContaining([
        ['oscillator.start', 0],
        ['oscillator.start', 0.06],
        ['oscillator.stop', 0.26],
      ]),
    );
  });
});
