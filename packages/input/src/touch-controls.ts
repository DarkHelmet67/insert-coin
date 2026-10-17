import { mergeKeyStates } from './merge-key-states';
import type { StickDirections } from './stick-direction';
import { createTouchButtons, type TouchButtons } from './touch-buttons';
import { createVirtualJoystick, type JoystickElements } from './virtual-joystick';

/** How the player moves on a touch screen: the virtual joystick or the arrow buttons. */
export type TouchMovement = 'joystick' | 'arrows';

/** The touch settings a game keeps in its `tuning.config.ts`. */
export interface TouchControlsSettings {
  /** Joystick or arrow buttons. */
  readonly movement: TouchMovement;
  /** The part of the joystick's push, from 0 to 1, that holds no key. */
  readonly deadZone: number;
}

/** The panel that holds the buttons and, maybe, the joystick. */
export type TouchPanel = Pick<
  HTMLElement,
  'addEventListener' | 'removeEventListener' | 'querySelector' | 'setAttribute'
>;

/**
 * The joystick inside `panel`: the element marked `data-joystick` is the touch zone, with the
 * base (`.stick-base`) and the knob (`.stick-knob`) inside it. `null` if any part is missing.
 */
export const findJoystick = (panel: Pick<ParentNode, 'querySelector'>): JoystickElements | null => {
  const zone = panel.querySelector<HTMLElement>('[data-joystick]');
  const base = zone?.querySelector('.stick-base');
  const knob = zone?.querySelector<HTMLElement>('.stick-knob');
  return zone && base && knob ? { zone, base, knob } : null;
};

/**
 * The game's touch controls: the panel buttons, plus the virtual joystick when the settings
 * ask for it and the page has one. The choice is written on the panel as
 * `data-touch-controls="joystick"` or `"arrows"`, so the stylesheet shows one and hides the
 * other. Both are polled as one set of keys.
 */
export const createTouchControls = (
  panel: TouchPanel,
  { movement, deadZone }: TouchControlsSettings,
  directions: StickDirections,
): TouchButtons => {
  const buttons = createTouchButtons(panel);
  const elements = movement === 'joystick' ? findJoystick(panel) : null;
  panel.setAttribute('data-touch-controls', elements ? 'joystick' : 'arrows');
  if (!elements) return buttons;

  const joystick = createVirtualJoystick(elements, { directions, deadZone });
  return {
    poll: () => mergeKeyStates(buttons.poll(), joystick.poll()),
    dispose: () => {
      buttons.dispose();
      joystick.dispose();
    },
  };
};
