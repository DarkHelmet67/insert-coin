import { isDown, wasPressed, type KeyCode, type KeyState } from './key-state';

/**
 * Maps each game action (e.g. `left`, `fire`) to the keys that trigger it.
 * Games reason about actions, never about keys: changing controls means changing only this table.
 */
export type KeyBindings<Action extends string> = Readonly<Record<Action, readonly KeyCode[]>>;

/** Whether any key bound to `action` is held down. */
export const isActionDown = <Action extends string>(
  state: KeyState,
  bindings: KeyBindings<Action>,
  action: Action,
): boolean => bindings[action].some((code) => isDown(state, code));

/** Whether any key bound to `action` went down since the previous step. */
export const wasActionPressed = <Action extends string>(
  state: KeyState,
  bindings: KeyBindings<Action>,
  action: Action,
): boolean => bindings[action].some((code) => wasPressed(state, code));

/** All the keys used by `bindings`, e.g. to stop the browser from scrolling when they are pressed. */
export const boundKeys = <Action extends string>(
  bindings: KeyBindings<Action>,
): ReadonlySet<KeyCode> => new Set(Object.values<readonly KeyCode[]>(bindings).flat());
