import { isActionDown, wasActionPressed, type KeyBindings, type KeyState } from '@arcade/input';
import type { Turn } from './rotation';

/** The keyboard inputs the game understands. */
export type Action =
  'left' | 'right' | 'leverUp' | 'leverDown' | 'abort' | 'start' | 'select' | 'coin' | 'mute';

/**
 * Keyboard layout [N]. The cabinet has a thrust lever that stays where it is left: up and down
 * arrows (or W and S) move it. Left and right arrows (A, D) turn the module, space is ABORT,
 * Enter the START button, Tab the SELECT button. Enter also drops a coin when there is no fuel,
 * 5 or C drop one at any time; M switches the sound off and on, as in the other games.
 */
export const bindings: KeyBindings<Action> = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  leverUp: ['ArrowUp', 'KeyW'],
  leverDown: ['ArrowDown', 'KeyS'],
  abort: ['Space'],
  start: ['Enter', 'Digit1', 'Numpad1'],
  select: ['Tab'],
  coin: ['Digit5', 'Numpad5', 'KeyC'],
  mute: ['KeyM'],
};

/** What the player is doing during one frame, independent of the device used. */
export interface Controls {
  /** 1 to turn left, -1 to turn right, 0 for none or both [P ROTCHK]. */
  readonly turn: Turn;
  /** -1, 0 or 1: the lever moves down, stays, moves up. */
  readonly leverMove: -1 | 0 | 1;
  /** Where a touch slider puts the lever, 0 to 255, or null when nobody touches it. */
  readonly leverAt: number | null;
  /** The ABORT button is held. */
  readonly abort: boolean;
  /** Buttons that act once per press. */
  readonly start: boolean;
  readonly select: boolean;
  readonly coin: boolean;
  /** Switch the sound off or on: handled by the audio output, not by the game logic. */
  readonly mute: boolean;
}

/** No input: useful as a default and in tests. */
export const noControls: Controls = {
  turn: 0,
  leverMove: 0,
  leverAt: null,
  abort: false,
  start: false,
  select: false,
  coin: false,
  mute: false,
};

/** -1, 0 or 1 from two opposite buttons: both held cancel out, as on the cabinet [P ROTCHK]. */
const axis = (plus: boolean, minus: boolean): -1 | 0 | 1 => (plus === minus ? 0 : plus ? 1 : -1);

/** Translates the keyboard state into game controls. */
export const readControls = (keys: KeyState, leverAt: number | null = null): Controls => ({
  turn: axis(isActionDown(keys, bindings, 'left'), isActionDown(keys, bindings, 'right')),
  leverMove: axis(
    isActionDown(keys, bindings, 'leverUp'),
    isActionDown(keys, bindings, 'leverDown'),
  ),
  leverAt,
  abort: isActionDown(keys, bindings, 'abort') || wasActionPressed(keys, bindings, 'abort'),
  start: wasActionPressed(keys, bindings, 'start'),
  select: wasActionPressed(keys, bindings, 'select'),
  coin: wasActionPressed(keys, bindings, 'coin'),
  mute: wasActionPressed(keys, bindings, 'mute'),
});

/** The lever range, 0 to 255. */
const clampLever = (lever: number): number => Math.max(0, Math.min(255, Math.round(lever)));

/**
 * The lever after one frame [N]: a touch slider puts it where the finger is, the keys move it by
 * `step` and it stays where it is left, like the real one.
 */
export const moveLever = (lever: number, controls: Controls, step: number): number => {
  if (controls.leverAt !== null) return clampLever(controls.leverAt);
  return clampLever(lever + controls.leverMove * step);
};
