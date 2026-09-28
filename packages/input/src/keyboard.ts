import {
  applyKeyEvent,
  clearEdges,
  emptyKeyState,
  releaseAll,
  type KeyCode,
  type KeyState,
} from './key-state';

/** Where keyboard events come from: `window` in the browser, a plain `EventTarget` in tests. */
export type KeyboardTarget = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

/** Options for `createKeyboard`. */
export interface KeyboardOptions {
  /** Keys whose default browser action (scrolling, for arrows and space) must be blocked. */
  readonly captureKeys?: ReadonlySet<KeyCode>;
}

/** Live keyboard connected to the browser. */
export interface Keyboard {
  /** Returns the key state for the current simulation step and starts a new one. Call it once per update. */
  readonly poll: () => KeyState;
  /** Removes the event listeners. */
  readonly dispose: () => void;
}

/**
 * Connects the pure key state to browser events.
 * This is the imperative shell of the package: the only place with mutable state, private to this closure.
 */
export const createKeyboard = (
  target: KeyboardTarget = window,
  { captureKeys = new Set() }: KeyboardOptions = {},
): Keyboard => {
  let state = emptyKeyState;

  /** Records a key event, ignoring auto-repeat and blocking scrolling for captured keys. */
  const onKey = (type: 'down' | 'up') => (event: Event) => {
    const { code, repeat } = event as KeyboardEvent;
    if (captureKeys.has(code)) event.preventDefault();
    if (!repeat) state = applyKeyEvent(state, { type, code });
  };
  /** Handles `keydown`. */
  const onKeyDown = onKey('down');
  /** Handles `keyup`. */
  const onKeyUp = onKey('up');
  /** Keys released while the page is not focused would otherwise stay "down" forever. */
  const onBlur = () => {
    state = releaseAll(state);
  };

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  target.addEventListener('blur', onBlur);

  return {
    poll: () => {
      const current = state;
      state = clearEdges(state);
      return current;
    },
    dispose: () => {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
      target.removeEventListener('blur', onBlur);
    },
  };
};
