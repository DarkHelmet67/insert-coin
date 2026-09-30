import { isActionDown, type KeyBindings, type KeyState } from '@arcade/input';

/** The keyboard inputs the game understands. */
export type Action = 'left' | 'right' | 'thrust';

/**
 * Keyboard layout, one key for each button of the cabinet: arrows or A/D rotate, up arrow or W
 * thrusts. Fire and hyperspace arrive with the next steps.
 */
export const bindings: KeyBindings<Action> = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  thrust: ['ArrowUp', 'KeyW'],
};

/** What the player is doing during one frame, independent of the device used. */
export interface Controls {
  /** 1 to rotate left, -1 to rotate right, 0 not to rotate. */
  readonly turn: -1 | 0 | 1;
  readonly thrust: boolean;
}

/** No input: useful as a default and in tests. */
export const noControls: Controls = { turn: 0, thrust: false };

/**
 * Translates the keyboard state into game controls. With both rotate buttons held the ship turns
 * left, as in the program, which checks the left button first [P $7086].
 */
export const readControls = (keys: KeyState): Controls => {
  const left = isActionDown(keys, bindings, 'left');
  const right = isActionDown(keys, bindings, 'right');
  return {
    turn: left ? 1 : right ? -1 : 0,
    thrust: isActionDown(keys, bindings, 'thrust'),
  };
};
