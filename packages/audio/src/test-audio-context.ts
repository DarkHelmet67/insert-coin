import type { UnlockableContext } from './audio';

/** One Web Audio call recorded by the fake context, e.g. `['oscillator.start', 0]`. */
export type AudioCall = readonly [string, ...unknown[]];

/** A fake `AudioParam` that records its automation calls under `name`. */
const fakeParam = (name: string, calls: AudioCall[]) => ({
  setValueAtTime: (value: number, time: number) => calls.push([`${name}.set`, value, time]),
  exponentialRampToValueAtTime: (value: number, time: number) =>
    calls.push([`${name}.ramp`, value, time]),
  linearRampToValueAtTime: (value: number, time: number) =>
    calls.push([`${name}.linear`, value, time]),
});

/**
 * A fake audio context for tests: instead of making sound, it records the nodes created and
 * the calls made on them, so the synthesizer can be checked in Node without a browser.
 */
export const createRecordingAudioContext = (
  state: AudioContextState = 'running',
): UnlockableContext & { readonly calls: AudioCall[] } => {
  const calls: AudioCall[] = [];
  /** A fake audio node that records connect, start and stop. */
  const node = (name: string) => ({
    connect: () => calls.push([`${name}.connect`]),
    start: (time: number) => calls.push([`${name}.start`, time]),
    stop: (time: number) => calls.push([`${name}.stop`, time]),
  });
  const fake = {
    calls,
    state,
    currentTime: 0,
    sampleRate: 1000,
    destination: {},
    resume: () => {
      calls.push(['resume']);
      return Promise.resolve();
    },
    createOscillator: () => ({ ...node('oscillator'), frequency: fakeParam('frequency', calls) }),
    createGain: () => ({ ...node('gain'), gain: fakeParam('gain', calls) }),
    createBiquadFilter: () => ({ ...node('filter'), frequency: fakeParam('cutoff', calls) }),
    createBufferSource: () => node('source'),
    createBuffer: (_channels: number, length: number) => {
      calls.push(['buffer', length]);
      return { copyToChannel: () => undefined };
    },
  };
  return fake as unknown as UnlockableContext & { readonly calls: AudioCall[] };
};
