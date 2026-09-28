import { applyKeyEvent, type KeyCode, type KeyEvent, type KeyState } from './key-state';

/**
 * Which on-screen button each finger is on, by pointer id.
 * Tracking fingers, not buttons, is what makes multitouch work: one thumb can hold "left"
 * while the other taps "fire", and a thumb can slide from "left" to "right" without lifting.
 */
export type PointerKeys = ReadonlyMap<number, KeyCode>;

/** No finger on any button. */
export const noPointers: PointerKeys = new Map();

/**
 * Returns the pointers after finger `id` moved onto the button for `code`.
 * `undefined` means the finger is touching the panel but outside every button.
 */
export const movePointer = (
  pointers: PointerKeys,
  id: number,
  code: KeyCode | undefined,
): PointerKeys => {
  const others = [...pointers].filter(([pointerId]) => pointerId !== id);
  return new Map(code === undefined ? others : [...others, [id, code]]);
};

/** Returns the pointers after finger `id` left the screen. */
export const releasePointer = (pointers: PointerKeys, id: number): PointerKeys =>
  movePointer(pointers, id, undefined);

/** The keys held by at least one finger. */
export const heldKeys = (pointers: PointerKeys): ReadonlySet<KeyCode> => new Set(pointers.values());

/** The key events that turn the keys held in `before` into those held in `after`. */
export const keyChanges = (
  before: ReadonlySet<KeyCode>,
  after: ReadonlySet<KeyCode>,
): readonly KeyEvent[] => [
  ...[...before].filter((code) => !after.has(code)).map((code) => ({ type: 'up' as const, code })),
  ...[...after]
    .filter((code) => !before.has(code))
    .map((code) => ({ type: 'down' as const, code })),
];

/** Returns the key state after the fingers moved from `before` to `after`. */
export const applyPointerChange = (
  state: KeyState,
  before: PointerKeys,
  after: PointerKeys,
): KeyState => keyChanges(heldKeys(before), heldKeys(after)).reduce(applyKeyEvent, state);
