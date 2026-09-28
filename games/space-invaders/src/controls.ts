import { isActionDown, wasActionPressed, type KeyBindings, type KeyState } from '@arcade/input';

/** The buttons of the original cabinet. */
export type Action = 'left' | 'right' | 'fire' | 'coin' | 'mute' | 'colorMode';

/**
 * Keyboard layout: arrows or A/D to move, space to fire, C (or 5, as in MAME) to insert a coin,
 * M to mute, V to switch between the monochrome and the colored screen.
 */
export const bindings: KeyBindings<Action> = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  fire: ['Space'],
  coin: ['KeyC', 'Digit5'],
  mute: ['KeyM'],
  colorMode: ['KeyV'],
};

/** What the player is doing during one simulation step, independent of the keys used. */
export interface Controls {
  /** -1 to move left, 1 to move right, 0 to stand still (also when both directions are held). */
  readonly direction: -1 | 0 | 1;
  readonly fire: boolean;
  readonly coin: boolean;
  /** Switch the sound off or on: handled by the audio output, not by the game logic. */
  readonly mute: boolean;
  /** Switch between the monochrome and the colored screen. */
  readonly colorMode: boolean;
}

/** No input: useful as a default and in tests. */
export const noControls: Controls = {
  direction: 0,
  fire: false,
  coin: false,
  mute: false,
  colorMode: false,
};

/** Translates the keyboard state into cabinet controls. */
export const readControls = (keys: KeyState): Controls => {
  const left = isActionDown(keys, bindings, 'left');
  const right = isActionDown(keys, bindings, 'right');
  return {
    direction: left === right ? 0 : left ? -1 : 1,
    fire: wasActionPressed(keys, bindings, 'fire'),
    coin: wasActionPressed(keys, bindings, 'coin'),
    mute: wasActionPressed(keys, bindings, 'mute'),
    colorMode: wasActionPressed(keys, bindings, 'colorMode'),
  };
};
