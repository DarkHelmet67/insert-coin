import { applyKeyEvent, clearEdges, emptyKeyState, type KeyCode } from '@arcade/input';
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

  it('fires on a new press of space only', () => {
    const pressed = pressedKeys('Space');
    expect(readControls(pressed).fire).toBe(true);
    expect(readControls(clearEdges(pressed)).fire).toBe(false);
  });

  it('jumps while the down arrow or S is held', () => {
    expect(readControls(pressedKeys('ArrowDown')).hyperspace).toBe(true);
    expect(readControls(clearEdges(pressedKeys('KeyS'))).hyperspace).toBe(true);
  });

  it('starts on a new press of Enter or 1', () => {
    expect(readControls(pressedKeys('Enter')).start).toBe(true);
    expect(readControls(pressedKeys('Digit1')).start).toBe(true);
    expect(readControls(clearEdges(pressedKeys('Enter'))).start).toBe(false);
  });

  it('switches the sound with M', () => {
    expect(readControls(pressedKeys('KeyM')).mute).toBe(true);
  });
});
