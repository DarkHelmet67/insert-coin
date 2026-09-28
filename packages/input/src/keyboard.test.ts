import { describe, expect, it } from 'vitest';
import { createKeyboard } from './keyboard';
import { isDown, wasPressed } from './key-state';

/** Builds an event shaped like a browser `KeyboardEvent`. */
const keyEvent = (type: 'keydown' | 'keyup', code: string, repeat = false): Event =>
  Object.assign(new Event(type, { cancelable: true }), { code, repeat });

describe('createKeyboard', () => {
  it('reports each press in exactly one poll', () => {
    const target = new EventTarget();
    const keyboard = createKeyboard(target);

    target.dispatchEvent(keyEvent('keydown', 'Space'));
    expect(wasPressed(keyboard.poll(), 'Space')).toBe(true);
    const next = keyboard.poll();
    expect(wasPressed(next, 'Space')).toBe(false);
    expect(isDown(next, 'Space')).toBe(true);
  });

  it('ignores auto-repeat events', () => {
    const target = new EventTarget();
    const keyboard = createKeyboard(target);

    target.dispatchEvent(keyEvent('keydown', 'Space'));
    keyboard.poll();
    target.dispatchEvent(keyEvent('keydown', 'Space', true));
    expect(wasPressed(keyboard.poll(), 'Space')).toBe(false);
  });

  it('releases every key when the window loses focus', () => {
    const target = new EventTarget();
    const keyboard = createKeyboard(target);

    target.dispatchEvent(keyEvent('keydown', 'ArrowLeft'));
    target.dispatchEvent(new Event('blur'));
    expect(isDown(keyboard.poll(), 'ArrowLeft')).toBe(false);
  });

  it('blocks the browser default action only for captured keys', () => {
    const target = new EventTarget();
    createKeyboard(target, { captureKeys: new Set(['Space']) });

    const space = keyEvent('keydown', 'Space');
    const tab = keyEvent('keydown', 'Tab');
    target.dispatchEvent(space);
    target.dispatchEvent(tab);
    expect(space.defaultPrevented).toBe(true);
    expect(tab.defaultPrevented).toBe(false);
  });

  it('stops listening after dispose', () => {
    const target = new EventTarget();
    const keyboard = createKeyboard(target);

    keyboard.dispose();
    target.dispatchEvent(keyEvent('keydown', 'Space'));
    expect(isDown(keyboard.poll(), 'Space')).toBe(false);
  });
});
