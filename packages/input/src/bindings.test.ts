import { describe, expect, it } from 'vitest';
import { boundKeys, isActionDown, wasActionPressed, type KeyBindings } from './bindings';
import { applyKeyEvent, clearEdges, emptyKeyState } from './key-state';

/** Actions used by the tests. */
type Action = 'left' | 'fire';

const bindings: KeyBindings<Action> = {
  left: ['ArrowLeft', 'KeyA'],
  fire: ['Space'],
};

describe('actions', () => {
  it('is down when any of its keys is down', () => {
    const state = applyKeyEvent(emptyKeyState, { type: 'down', code: 'KeyA' });
    expect(isActionDown(state, bindings, 'left')).toBe(true);
    expect(isActionDown(state, bindings, 'fire')).toBe(false);
  });

  it('is pressed only in the step when a key goes down', () => {
    const pressed = applyKeyEvent(emptyKeyState, { type: 'down', code: 'Space' });
    expect(wasActionPressed(pressed, bindings, 'fire')).toBe(true);
    expect(wasActionPressed(clearEdges(pressed), bindings, 'fire')).toBe(false);
  });

  it('lists every bound key once', () => {
    expect(boundKeys(bindings)).toEqual(new Set(['ArrowLeft', 'KeyA', 'Space']));
  });
});
