import type { SoundEffect } from './sound';
import { nextChunkStart } from './stream';
import { playEffect, playSamples, type SynthContext } from './synth';

/** An audio context that may start suspended, as browsers do until the user interacts with the page. */
export type UnlockableContext = SynthContext & Pick<AudioContext, 'state' | 'resume'>;

/** Where user gestures come from: `window` in the browser, a plain `EventTarget` in tests. */
export type GestureTarget = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

/** Options for `createAudio`. */
export interface AudioOptions {
  readonly target?: GestureTarget;
  /** Builds the audio context; replaced by a fake in tests. */
  readonly createContext?: () => UnlockableContext;
}

/** Sound output of a game. */
export interface AudioPlayer {
  /** Plays a sound effect; does nothing while muted or before the first user gesture. */
  readonly play: (effect: SoundEffect) => void;
  /**
   * Queues a chunk of samples (one channel at `rate` hertz) right after the previous one, for
   * sounds the game makes itself; does nothing while muted or before the first user gesture.
   */
  readonly stream: (samples: Float32Array<ArrayBuffer>, rate: number) => void;
  /** Switches the sound off or back on. */
  readonly toggleMute: () => void;
  readonly isMuted: () => boolean;
  /** Removes the event listeners. */
  readonly dispose: () => void;
}

/**
 * User gestures that browsers accept as permission to start audio.
 * A finger counts only when it is lifted (`pointerup`, `touchend`), not when it touches the
 * screen: that is why the touch events are listed too, otherwise phones would stay silent.
 */
const UNLOCK_EVENTS = ['keydown', 'pointerdown', 'pointerup', 'touchend'] as const;

/**
 * Creates the game's audio output.
 * Browsers block sound until the user interacts with the page (autoplay policy), so the
 * audio context is created, or resumed, on the first key press, click or tap.
 */
export const createAudio = ({
  target = window,
  createContext = () => new AudioContext(),
}: AudioOptions = {}): AudioPlayer => {
  let ctx: UnlockableContext | undefined;
  let muted = false;
  // Where the last queued chunk ends, on the audio clock.
  let cursor = 0;

  /** Creates the audio context on the first gesture and resumes it if the browser suspended it. */
  const unlock = (): void => {
    ctx ??= createContext();
    if (ctx.state === 'suspended') void ctx.resume();
  };

  UNLOCK_EVENTS.forEach((type) => {
    target.addEventListener(type, unlock);
  });

  return {
    play: (effect) => {
      if (ctx && !muted) playEffect(ctx, effect);
    },
    stream: (samples, rate) => {
      if (!ctx || muted) return;
      const start = nextChunkStart(cursor, ctx.currentTime);
      if (start === undefined) return;
      playSamples(ctx, samples, rate, start);
      cursor = start + samples.length / rate;
    },
    toggleMute: () => {
      muted = !muted;
    },
    isMuted: () => muted,
    dispose: () => {
      UNLOCK_EVENTS.forEach((type) => {
        target.removeEventListener(type, unlock);
      });
    },
  };
};
