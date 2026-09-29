import { wasActionPressed, type KeyBindings, type KeyState } from '@arcade/input';

/** The inputs the game understands so far. */
export type Action = 'colorMode';

/** Keyboard layout: V switches between the monochrome and the colored screen. */
export const bindings: KeyBindings<Action> = {
  colorMode: ['KeyV'],
};

/** What the player is doing during one frame, independent of the keys used. */
export interface Controls {
  /** Switch between the monochrome and the colored screen. */
  readonly colorMode: boolean;
}

/** No input: useful as a default and in tests. */
export const noControls: Controls = { colorMode: false };

/** Translates the keyboard state into game controls. */
export const readControls = (keys: KeyState): Controls => ({
  colorMode: wasActionPressed(keys, bindings, 'colorMode'),
});
