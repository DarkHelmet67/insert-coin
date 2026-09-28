import { describe, expect, it } from 'vitest';
import { applyKeyEvent, emptyKeyState, isDown, wasPressed, wasReleased } from './key-state';
import { mergeKeyStates } from './merge-key-states';

describe('mergeKeyStates', () => {
  it('holds and presses the keys of both devices', () => {
    const keyboard = applyKeyEvent(emptyKeyState, { type: 'down', code: 'ArrowLeft' });
    const touch = applyKeyEvent(emptyKeyState, { type: 'down', code: 'Space' });
    const merged = mergeKeyStates(keyboard, touch);

    expect(isDown(merged, 'ArrowLeft')).toBe(true);
    expect(wasPressed(merged, 'Space')).toBe(true);
  });

  it('does not release a key the other device still holds', () => {
    const pressed = applyKeyEvent(emptyKeyState, { type: 'down', code: 'Space' });
    const released = applyKeyEvent(pressed, { type: 'up', code: 'Space' });
    const merged = mergeKeyStates(released, pressed);

    expect(isDown(merged, 'Space')).toBe(true);
    expect(wasReleased(merged, 'Space')).toBe(false);
  });
});
