import { isActionDown, wasActionPressed, type KeyBindings, type KeyState } from '@arcade/input';

/** The buttons of the cabinet, plus the audio switch of the remake. */
export type Action = 'left' | 'right' | 'fire' | 'coin' | 'mute';

/**
 * Keyboard layout: arrows or A/D to move, space (or Z) to fire, C (or 5, as in MAME) for a coin,
 * which also starts the game, M to mute.
 */
export const bindings: KeyBindings<Action> = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  fire: ['Space', 'KeyZ'],
  coin: ['KeyC', 'Digit5'],
  mute: ['KeyM'],
};

/** What the player is doing during one frame, whatever the keys used. */
export interface Controls {
  /** -1 left, 1 right, 0 none. Both held move right, as on the cabinet (`c_1F92`). */
  readonly direction: -1 | 0 | 1;
  /** The fire button went down in this frame: one press, one rocket. */
  readonly fire: boolean;
  readonly coin: boolean;
  readonly mute: boolean;
}

/** No input: a default and a helper for tests. */
export const noControls: Controls = { direction: 0, fire: false, coin: false, mute: false };

/** Translates the keys into cabinet controls. */
export const readControls = (keys: KeyState): Controls => {
  const left = isActionDown(keys, bindings, 'left');
  const right = isActionDown(keys, bindings, 'right');
  return {
    direction: right ? 1 : left ? -1 : 0,
    fire: wasActionPressed(keys, bindings, 'fire'),
    coin: wasActionPressed(keys, bindings, 'coin'),
    mute: wasActionPressed(keys, bindings, 'mute'),
  };
};
