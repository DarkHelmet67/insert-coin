import { describe, expect, it } from 'vitest';
import { applyKeyEvent, emptyKeyState, type KeyState } from '@arcade/input';
import { moveLever, noControls, readControls } from './controls';

/** The key state with `codes` just pressed. */
const pressed = (...codes: string[]): KeyState =>
  codes.reduce((state, code) => applyKeyEvent(state, { type: 'down', code }), emptyKeyState);

describe('controls', () => {
  it('turns left, right, or not at all with both buttons', () => {
    expect(readControls(pressed('ArrowLeft')).turn).toBe(1);
    expect(readControls(pressed('ArrowRight')).turn).toBe(-1);
    expect(readControls(pressed('ArrowLeft', 'ArrowRight')).turn).toBe(0);
  });

  it('moves the lever with the keys, and it stays where it is left', () => {
    const up = readControls(pressed('ArrowUp'));
    expect(moveLever(100, up, 8)).toBe(108);
    expect(moveLever(100, noControls, 8)).toBe(100);
    expect(moveLever(250, up, 8)).toBe(255);
    expect(moveLever(4, readControls(pressed('ArrowDown')), 8)).toBe(0);
  });

  it('puts the lever under the finger of a touch slider', () => {
    expect(moveLever(0, { ...noControls, leverAt: 180 }, 8)).toBe(180);
  });

  it('reads the buttons of the cabinet', () => {
    const controls = readControls(pressed('Space', 'Enter', 'Tab', 'KeyC'));
    expect(controls).toMatchObject({ abort: true, start: true, select: true, coin: true });
  });
});
