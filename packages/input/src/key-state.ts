/** A physical key, identified by `KeyboardEvent.code` (e.g. `ArrowLeft`, `Space`, `KeyA`): independent of the keyboard layout. */
export type KeyCode = string;

/**
 * Snapshot of the keyboard as the game sees it during one simulation step.
 * `pressed` and `released` are edges: they contain a key only in the step right after it changed.
 */
export interface KeyState {
  /** Keys currently held down. */
  readonly down: ReadonlySet<KeyCode>;
  /** Keys that went down since the previous step. */
  readonly pressed: ReadonlySet<KeyCode>;
  /** Keys that went up since the previous step. */
  readonly released: ReadonlySet<KeyCode>;
}

/** A key going down or up, reduced to what the game needs. */
export interface KeyEvent {
  readonly type: 'down' | 'up';
  readonly code: KeyCode;
}

/** The keyboard with no key held. */
export const emptyKeyState: KeyState = { down: new Set(), pressed: new Set(), released: new Set() };

/** Returns a copy of `set` with `code` added. */
const withKey = (set: ReadonlySet<KeyCode>, code: KeyCode): ReadonlySet<KeyCode> =>
  new Set([...set, code]);

/** Returns a copy of `set` without `code`. */
const withoutKey = (set: ReadonlySet<KeyCode>, code: KeyCode): ReadonlySet<KeyCode> =>
  new Set([...set].filter((key) => key !== code));

/**
 * Returns the key state after `event`.
 * A key already down does not count as pressed again: this ignores the operating system's auto-repeat.
 */
export const applyKeyEvent = (state: KeyState, { type, code }: KeyEvent): KeyState => {
  if (type === 'down') {
    return state.down.has(code)
      ? state
      : { ...state, down: withKey(state.down, code), pressed: withKey(state.pressed, code) };
  }
  return state.down.has(code)
    ? { ...state, down: withoutKey(state.down, code), released: withKey(state.released, code) }
    : state;
};

/** Returns the key state for the next step: same keys held, edges cleared. */
export const clearEdges = (state: KeyState): KeyState => ({
  down: state.down,
  pressed: new Set(),
  released: new Set(),
});

/** Returns the key state after every held key has been released, e.g. when the window loses focus. */
export const releaseAll = (state: KeyState): KeyState => ({
  down: new Set(),
  pressed: state.pressed,
  released: new Set([...state.released, ...state.down]),
});

/** Whether `code` is held down. */
export const isDown = (state: KeyState, code: KeyCode): boolean => state.down.has(code);

/** Whether `code` went down since the previous step. */
export const wasPressed = (state: KeyState, code: KeyCode): boolean => state.pressed.has(code);

/** Whether `code` went up since the previous step. */
export const wasReleased = (state: KeyState, code: KeyCode): boolean => state.released.has(code);
