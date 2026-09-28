import { clearEdges, emptyKeyState, type KeyCode, type KeyState } from './key-state';
import {
  applyPointerChange,
  movePointer,
  noPointers,
  releasePointer,
  type PointerKeys,
} from './pointer-keys';

/** Where pointer events come from: the button panel in the browser, a plain `EventTarget` in tests. */
export type TouchTarget = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

/** Finds the key of the button under a pointer, or `undefined` outside every button. */
export type KeyAt = (event: PointerEvent) => KeyCode | undefined;

/** Options for `createTouchButtons`. */
export interface TouchButtonsOptions {
  /** How to find the button under a finger; replaced by a fake in tests. */
  readonly keyAt?: KeyAt;
}

/** Live on-screen buttons, polled like a keyboard. */
export interface TouchButtons {
  /** Returns the key state for the current simulation step and starts a new one. Call it once per update. */
  readonly poll: () => KeyState;
  /** Removes the event listeners. */
  readonly dispose: () => void;
}

/**
 * Default `keyAt`: the `data-key` attribute of the button under the finger.
 * It looks at the finger's position, not at the event target, because on touch screens the
 * target stays the element the finger first touched, even after sliding onto another button.
 */
const keyUnderPointer: KeyAt = ({ clientX, clientY }) => {
  const element = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>('[data-key]');
  return element?.dataset.key;
};

/**
 * Turns on-screen buttons into "virtual keys": each button has a `data-key` attribute
 * (e.g. `data-key="Space"`) and produces the same key state as the physical key,
 * so the game reads touch and keyboard with the same code.
 * Like `createKeyboard`, this is an imperative shell with state private to the closure.
 */
export const createTouchButtons = (
  target: TouchTarget,
  { keyAt = keyUnderPointer }: TouchButtonsOptions = {},
): TouchButtons => {
  let pointers: PointerKeys = noPointers;
  let state: KeyState = emptyKeyState;

  /** Moves the fingers to `next` and records the keys that changed. */
  const update = (next: PointerKeys): void => {
    state = applyPointerChange(state, pointers, next);
    pointers = next;
  };

  /** A finger touches the panel: block the browser's own gestures (zoom, selection, menus). */
  const onDown = (event: Event): void => {
    event.preventDefault();
    const pointer = event as PointerEvent;
    update(movePointer(pointers, pointer.pointerId, keyAt(pointer)));
  };
  /** A finger slides, maybe onto another button. A mouse just hovering (no button held) does not count. */
  const onMove = (event: Event): void => {
    const pointer = event as PointerEvent;
    if (pointer.buttons !== 0) update(movePointer(pointers, pointer.pointerId, keyAt(pointer)));
  };
  /** A finger leaves the screen, or the system takes it over (`pointercancel`). */
  const onUp = (event: Event): void => {
    update(releasePointer(pointers, (event as PointerEvent).pointerId));
  };
  /** A long press would otherwise open the context menu. */
  const onContextMenu = (event: Event): void => {
    event.preventDefault();
  };

  const listeners: readonly (readonly [string, (event: Event) => void])[] = [
    ['pointerdown', onDown],
    ['pointermove', onMove],
    ['pointerup', onUp],
    ['pointercancel', onUp],
    ['contextmenu', onContextMenu],
  ];
  listeners.forEach(([type, listener]) => {
    target.addEventListener(type, listener);
  });

  return {
    poll: () => {
      const current = state;
      state = clearEdges(state);
      return current;
    },
    dispose: () => {
      listeners.forEach(([type, listener]) => {
        target.removeEventListener(type, listener);
      });
    },
  };
};
