import type { SoundEffect } from './sound';
import { playEffect, type SynthContext } from './synth';

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
  /** Switches the sound off or back on. */
  readonly toggleMute: () => void;
  readonly isMuted: () => boolean;
  /** Removes the event listeners. */
  readonly dispose: () => void;
}

/** User gestures that browsers accept as permission to start audio. */
const UNLOCK_EVENTS = ['keydown', 'pointerdown'] as const;

/**
 * Creates the game's audio output.
 * Browsers block sound until the user interacts with the page (autoplay policy), so the
 * audio context is created, or resumed, on the first key press or click.
 */
export const createAudio = ({
  target = window,
  createContext = () => new AudioContext(),
}: AudioOptions = {}): AudioPlayer => {
  let ctx: UnlockableContext | undefined;
  let muted = false;

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
