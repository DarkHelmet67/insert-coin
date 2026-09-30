import { applyKeyEvent, emptyKeyState, type KeyCode } from '@arcade/input';
import { describe, expect, it } from 'vitest';
import { noControls, readControls } from './controls';

/** The keyboard with `codes` just pressed. */
const pressedKeys = (...codes: KeyCode[]) =>
  codes.reduce((keys, code) => applyKeyEvent(keys, { type: 'down', code }), emptyKeyState);

describe('readControls', () => {
  it('reads nothing when no key is pressed', () => {
    expect(readControls(emptyKeyState)).toEqual(noControls);
  });

  it('rotates with the arrows or A/D, left winning when both are held', () => {
    expect(readControls(pressedKeys('ArrowLeft')).turn).toBe(1);
    expect(readControls(pressedKeys('KeyD')).turn).toBe(-1);
    expect(readControls(pressedKeys('ArrowLeft', 'ArrowRight')).turn).toBe(1);
  });

  it('thrusts with the up arrow or W', () => {
    expect(readControls(pressedKeys('ArrowUp')).thrust).toBe(true);
    expect(readControls(pressedKeys('KeyW')).thrust).toBe(true);
  });
});
