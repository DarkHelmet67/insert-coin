import type { KeyCode, KeyState } from './key-state';

/** Returns the union of two sets. */
const union = (a: ReadonlySet<KeyCode>, b: ReadonlySet<KeyCode>): ReadonlySet<KeyCode> =>
  new Set([...a, ...b]);

/**
 * Combines two input devices (e.g. keyboard and touch buttons) into one key state,
 * as if they were wired to the same cabinet buttons.
 * A key counts as released only if neither device still holds it down.
 */
export const mergeKeyStates = (a: KeyState, b: KeyState): KeyState => {
  const down = union(a.down, b.down);
  return {
    down,
    pressed: union(a.pressed, b.pressed),
    released: new Set([...union(a.released, b.released)].filter((code) => !down.has(code))),
  };
};
