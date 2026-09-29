import { applyKeyEvent, emptyKeyState, type KeyCode } from '@arcade/input';
import { describe, expect, it } from 'vitest';
import { noControls, readControls } from './controls';

/** A pointer that did nothing. */
const still = { x: undefined, pressed: false };

/** The keyboard with `codes` just pressed. */
const pressedKeys = (...codes: KeyCode[]) =>
  codes.reduce((keys, code) => applyKeyEvent(keys, { type: 'down', code }), emptyKeyState);

describe('readControls', () => {
  it('reads nothing when no key is pressed and the pointer is still', () => {
    expect(readControls(emptyKeyState, still)).toEqual(noControls);
  });

  it('moves with the arrows or A/D, and stands still with both directions', () => {
    expect(readControls(pressedKeys('ArrowLeft'), still).direction).toBe(-1);
    expect(readControls(pressedKeys('KeyD'), still).direction).toBe(1);
    expect(readControls(pressedKeys('ArrowLeft', 'ArrowRight'), still).direction).toBe(0);
  });

  it('passes the pointer position through', () => {
    expect(readControls(emptyKeyState, { x: 100, pressed: false }).pointerX).toBe(100);
  });

  it('serves with space, Enter, a click or a tap', () => {
    expect(readControls(pressedKeys('Space'), still).serve).toBe(true);
    expect(readControls(pressedKeys('Enter'), still).serve).toBe(true);
    expect(readControls(emptyKeyState, { x: 50, pressed: true }).serve).toBe(true);
  });

  it('switches the colors with V', () => {
    expect(readControls(pressedKeys('KeyV'), still).colorMode).toBe(true);
  });
});
