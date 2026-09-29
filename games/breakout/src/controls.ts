import {
  isActionDown,
  wasActionPressed,
  type KeyBindings,
  type KeyState,
  type PointerSnapshot,
} from '@arcade/input';

/** The keyboard inputs the game understands. */
export type Action = 'left' | 'right' | 'serve' | 'mute' | 'colorMode';

/**
 * Keyboard layout: arrows or A/D move the paddle, space or Enter serve, M mutes, V switches
 * between the monochrome and the colored screen. The mouse and the finger move the paddle too, like the
 * cabinet's knob, and a click or a tap serves.
 */
export const bindings: KeyBindings<Action> = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  serve: ['Space', 'Enter'],
  mute: ['KeyM'],
  colorMode: ['KeyV'],
};

/** What the player is doing during one frame, independent of the device used. */
export interface Controls {
  /** -1 to move the paddle left, 1 to move it right, 0 to leave it (also with both keys). */
  readonly direction: -1 | 0 | 1;
  /** Where the mouse or finger moved to, in screen units, or `undefined` if it did not move. */
  readonly pointerX: number | undefined;
  /** The SERVE button of the cabinet; in the attract mode it also starts a game. */
  readonly serve: boolean;
  /** Sound off or on. */
  readonly mute: boolean;
  /** Switch between the monochrome and the colored screen. */
  readonly colorMode: boolean;
}

/** No input: useful as a default and in tests. */
export const noControls: Controls = {
  direction: 0,
  pointerX: undefined,
  serve: false,
  mute: false,
  colorMode: false,
};

/** Translates the keyboard state and the pointer into game controls. */
export const readControls = (keys: KeyState, pointer: PointerSnapshot): Controls => {
  const left = isActionDown(keys, bindings, 'left');
  const right = isActionDown(keys, bindings, 'right');
  return {
    direction: left === right ? 0 : left ? -1 : 1,
    pointerX: pointer.x,
    serve: pointer.pressed || wasActionPressed(keys, bindings, 'serve'),
    mute: wasActionPressed(keys, bindings, 'mute'),
    colorMode: wasActionPressed(keys, bindings, 'colorMode'),
  };
};
