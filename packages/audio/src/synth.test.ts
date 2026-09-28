import { describe, expect, it } from 'vitest';
import { SILENCE } from './sound';
import { playSound } from './synth';
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
});
