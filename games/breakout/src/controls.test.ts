import { applyKeyEvent, emptyKeyState, type KeyCode } from '@arcade/input';
import { describe, expect, it } from 'vitest';
import { noControls, readControls } from './controls';

/** The keyboard with `codes` just pressed. */
const pressed = (...codes: KeyCode[]) =>
  codes.reduce((keys, code) => applyKeyEvent(keys, { type: 'down', code }), emptyKeyState);

describe('readControls', () => {
  it('reads nothing when no key is pressed and the pointer is still', () => {
    expect(readControls(emptyKeyState, undefined)).toEqual(noControls);
  });

  it('moves with the arrows or A/D, and stands still with both directions', () => {
    expect(readControls(pressed('ArrowLeft'), undefined).direction).toBe(-1);
    expect(readControls(pressed('KeyD'), undefined).direction).toBe(1);
    expect(readControls(pressed('ArrowLeft', 'ArrowRight'), undefined).direction).toBe(0);
  });

  it('passes the pointer position through', () => {
    expect(readControls(emptyKeyState, 100).pointerX).toBe(100);
  });

  it('switches the colors with V', () => {
    expect(readControls(pressed('KeyV'), undefined).colorMode).toBe(true);
  });
});
