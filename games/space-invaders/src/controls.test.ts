import { applyKeyEvent, emptyKeyState, type KeyCode } from '@arcade/input';
import { describe, expect, it } from 'vitest';
import { readControls } from './controls';

/** Key state with the given keys just pressed. */
const pressing = (...codes: readonly KeyCode[]) =>
  codes.reduce((state, code) => applyKeyEvent(state, { type: 'down', code }), emptyKeyState);

describe('readControls', () => {
  it('reads the direction from arrows or A/D', () => {
    expect(readControls(pressing('ArrowLeft')).direction).toBe(-1);
    expect(readControls(pressing('KeyD')).direction).toBe(1);
    expect(readControls(emptyKeyState).direction).toBe(0);
  });

  it('stands still when both directions are held', () => {
    expect(readControls(pressing('ArrowLeft', 'ArrowRight')).direction).toBe(0);
  });

  it('reads fire and coin', () => {
    expect(readControls(pressing('Space')).fire).toBe(true);
    expect(readControls(pressing('Digit5')).coin).toBe(true);
  });

  it('reads the color mode switch from V', () => {
    expect(readControls(pressing('KeyV')).colorMode).toBe(true);
  });
});
