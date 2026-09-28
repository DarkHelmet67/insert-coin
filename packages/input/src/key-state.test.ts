import { describe, expect, it } from 'vitest';
import {
  applyKeyEvent,
  clearEdges,
  emptyKeyState,
  isDown,
  releaseAll,
  wasPressed,
  wasReleased,
  type KeyEvent,
  type KeyState,
} from './key-state';

/** Applies a sequence of key events starting from `state`. */
const applyAll = (state: KeyState, events: readonly KeyEvent[]): KeyState =>
  events.reduce(applyKeyEvent, state);

describe('applyKeyEvent', () => {
  it('marks a key as down and pressed', () => {
    const state = applyKeyEvent(emptyKeyState, { type: 'down', code: 'Space' });
    expect(isDown(state, 'Space')).toBe(true);
    expect(wasPressed(state, 'Space')).toBe(true);
  });

  it('marks a key as released when it goes up', () => {
    const state = applyAll(emptyKeyState, [
      { type: 'down', code: 'Space' },
      { type: 'up', code: 'Space' },
    ]);
    expect(isDown(state, 'Space')).toBe(false);
    expect(wasReleased(state, 'Space')).toBe(true);
  });

  it('keeps a quick tap visible as pressed even if the key is already up', () => {
    const state = applyAll(emptyKeyState, [
      { type: 'down', code: 'Space' },
      { type: 'up', code: 'Space' },
    ]);
    expect(wasPressed(state, 'Space')).toBe(true);
  });

  it('ignores a second down for a key already held', () => {
    const held = clearEdges(applyKeyEvent(emptyKeyState, { type: 'down', code: 'Space' }));
    expect(applyKeyEvent(held, { type: 'down', code: 'Space' })).toBe(held);
  });

  it('ignores an up for a key that was not down', () => {
    expect(applyKeyEvent(emptyKeyState, { type: 'up', code: 'Space' })).toBe(emptyKeyState);
  });

  it('does not modify the state it receives', () => {
    applyKeyEvent(emptyKeyState, { type: 'down', code: 'Space' });
    expect(emptyKeyState.down.size).toBe(0);
  });
});

describe('clearEdges', () => {
  it('keeps held keys but forgets pressed and released', () => {
    const state = clearEdges(applyKeyEvent(emptyKeyState, { type: 'down', code: 'KeyA' }));
    expect(isDown(state, 'KeyA')).toBe(true);
    expect(wasPressed(state, 'KeyA')).toBe(false);
  });
});

describe('releaseAll', () => {
  it('releases every held key', () => {
    const state = releaseAll(
      applyAll(emptyKeyState, [
        { type: 'down', code: 'KeyA' },
        { type: 'down', code: 'KeyD' },
      ]),
    );
    expect(state.down.size).toBe(0);
    expect(wasReleased(state, 'KeyA')).toBe(true);
    expect(wasReleased(state, 'KeyD')).toBe(true);
  });
});
