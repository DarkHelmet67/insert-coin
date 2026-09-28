import { describe, expect, it, vi } from 'vitest';
import { createAudio } from './audio';
import type { Sound } from './sound';
import { createRecordingAudioContext } from './test-audio-context';

const beep: Sound = {
  kind: 'tone',
  wave: 'square',
  from: 440,
  to: 440,
  duration: 0.1,
  volume: 0.5,
};

describe('createAudio', () => {
  it('stays silent until the first user gesture', () => {
    const createContext = vi.fn(() => createRecordingAudioContext());
    const audio = createAudio({ target: new EventTarget(), createContext });

    audio.play(beep);
    expect(createContext).not.toHaveBeenCalled();
  });

  it('creates the audio context on the first key press and plays afterwards', () => {
    const target = new EventTarget();
    const ctx = createRecordingAudioContext();
    const audio = createAudio({ target, createContext: () => ctx });

    target.dispatchEvent(new Event('keydown'));
    audio.play(beep);
    expect(ctx.calls).toContainEqual(['oscillator.start', 0]);
  });

  it('resumes a context the browser suspended', () => {
    const target = new EventTarget();
    const ctx = createRecordingAudioContext('suspended');
    createAudio({ target, createContext: () => ctx });

    target.dispatchEvent(new Event('pointerdown'));
    expect(ctx.calls).toContainEqual(['resume']);
  });

  it('unlocks on the end of a tap, the gesture phones accept', () => {
    const target = new EventTarget();
    const ctx = createRecordingAudioContext('suspended');
    createAudio({ target, createContext: () => ctx });

    target.dispatchEvent(new Event('touchend'));
    expect(ctx.calls).toContainEqual(['resume']);
  });

  it('plays nothing while muted', () => {
    const target = new EventTarget();
    const ctx = createRecordingAudioContext();
    const audio = createAudio({ target, createContext: () => ctx });
    target.dispatchEvent(new Event('keydown'));

    audio.toggleMute();
    audio.play(beep);
    expect(audio.isMuted()).toBe(true);
    expect(ctx.calls).toEqual([]);
  });
});
