import { applyKeyEvent, clearEdges, emptyKeyState, type KeyCode, type KeyState } from './key-state';
import { keyChanges } from './pointer-keys';
import {
  centered,
  shownOffset,
  stickKeys,
  stickOffset,
  type StickDirections,
  type StickOffset,
} from './stick-direction';
import type { TouchButtons } from './touch-buttons';

/** The touch area of the joystick: wider than the drawn base, so a thumb off the mark still counts. */
export type JoystickZone = Pick<
  HTMLElement,
  'addEventListener' | 'removeEventListener' | 'setPointerCapture'
>;

/** The parts of the joystick in the page. */
export interface JoystickElements {
  /** Where a finger can start pushing the stick. */
  readonly zone: JoystickZone;
  /** The drawn base: its centre is the stick's rest position, half its width the full push. */
  readonly base: Pick<Element, 'getBoundingClientRect'>;
  /** The knob, moved through the `--stick-x` and `--stick-y` CSS properties (-1 to 1). */
  readonly knob: Pick<HTMLElement, 'style'>;
}

/** Options for `createVirtualJoystick`. */
export interface VirtualJoystickOptions {
  /** Which arrows the stick can push. */
  readonly directions: StickDirections;
  /** The part of the push, from 0 to 1, that holds no key. */
  readonly deadZone: number;
}

/** The centre and the radius of the base, from its box on the screen. */
const baseGeometry = (base: JoystickElements['base']) => {
  const box = base.getBoundingClientRect();
  return {
    center: { x: box.left + box.width / 2, y: box.top + box.height / 2 },
    radius: box.width / 2,
  };
};

/**
 * A virtual joystick on a touch screen, polled like a keyboard: pushing the knob holds the
 * arrow keys, so the game reads it with the same code as the physical arrows.
 * The base stays where it is drawn; the first finger on the zone takes the stick and keeps it
 * until it lifts, even if it slides off the base (pointer capture), which is the point of a
 * joystick over separate arrow buttons. Other fingers are left to the other buttons.
 * Like `createTouchButtons`, this is an imperative shell with state private to the closure.
 */
export const createVirtualJoystick = (
  { zone, base, knob }: JoystickElements,
  { directions, deadZone }: VirtualJoystickOptions,
): TouchButtons => {
  let finger: number | undefined;
  let held: ReadonlySet<KeyCode> = new Set();
  let state: KeyState = emptyKeyState;

  /** Moves the knob to `offset`, on the screen and in the key state. */
  const push = (offset: StickOffset): void => {
    const shown = shownOffset(offset, directions);
    knob.style.setProperty('--stick-x', shown.x.toFixed(3));
    knob.style.setProperty('--stick-y', shown.y.toFixed(3));
    const next = stickKeys(offset, directions, deadZone);
    state = keyChanges(held, next).reduce(applyKeyEvent, state);
    held = next;
  };

  /** Follows the finger that holds the stick. */
  const follow = ({ clientX, clientY }: PointerEvent): void => {
    const { center, radius } = baseGeometry(base);
    push(stickOffset({ x: clientX, y: clientY }, center, radius));
  };

  /** A finger touches the zone: it takes the stick, unless another finger already has it. */
  const onDown = (event: Event): void => {
    event.preventDefault();
    const pointer = event as PointerEvent;
    if (finger !== undefined) return;
    finger = pointer.pointerId;
    zone.setPointerCapture(finger);
    follow(pointer);
  };
  /** The finger holding the stick slides. */
  const onMove = (event: Event): void => {
    const pointer = event as PointerEvent;
    if (pointer.pointerId === finger) follow(pointer);
  };
  /**
   * The finger lifts, the system takes it over, or the browser drops the capture (e.g. the
   * joystick is hidden mid-touch): the stick springs back to the centre. After a normal lift
   * `lostpointercapture` follows `pointerup`, and the second call finds no finger and does nothing.
   */
  const onUp = (event: Event): void => {
    if ((event as PointerEvent).pointerId !== finger) return;
    finger = undefined;
    push(centered);
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
    ['lostpointercapture', onUp],
    ['contextmenu', onContextMenu],
  ];
  listeners.forEach(([type, listener]) => {
    zone.addEventListener(type, listener);
  });

  return {
    poll: () => {
      const current = state;
      state = clearEdges(state);
      return current;
    },
    dispose: () => {
      listeners.forEach(([type, listener]) => {
        zone.removeEventListener(type, listener);
      });
    },
  };
};
