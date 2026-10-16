import { isActionDown, wasActionPressed, type KeyBindings, type KeyState } from '@arcade/input';
import type { Joystick } from './pacman';

/** The controls of the cabinet, plus the audio switch of the remake. */
export type Action = 'up' | 'down' | 'left' | 'right' | 'coin' | 'mute';

/**
 * Keyboard layout: arrows or WASD for the joystick, C (or 5, as in MAME) for a coin, which also
 * starts the game, M to mute.
 */
export const bindings: KeyBindings<Action> = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  coin: ['KeyC', 'Digit5'],
  mute: ['KeyM'],
};

/** What the player is doing during one frame, whatever the keys used. */
export interface Controls {
  readonly joystick: Joystick;
  readonly coin: boolean;
  readonly mute: boolean;
}

/** No input: a default and a helper for tests. */
export const noControls: Controls = {
  joystick: { up: false, down: false, left: false, right: false },
  coin: false,
  mute: false,
};

/** Translates the keys into cabinet controls. */
export const readControls = (keys: KeyState): Controls => ({
  joystick: {
    up: isActionDown(keys, bindings, 'up'),
    down: isActionDown(keys, bindings, 'down'),
    left: isActionDown(keys, bindings, 'left'),
    right: isActionDown(keys, bindings, 'right'),
  },
  coin: wasActionPressed(keys, bindings, 'coin'),
  mute: wasActionPressed(keys, bindings, 'mute'),
});
