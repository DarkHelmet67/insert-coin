import { applyKeyEvent, emptyKeyState } from '@arcade/input';
import { describe, expect, it } from 'vitest';
import { noControls, readControls } from './controls';

describe('readControls', () => {
  it('reads nothing when no key is pressed', () => {
    expect(readControls(emptyKeyState)).toEqual(noControls);
  });

  it('switches the colors with V', () => {
    const keys = applyKeyEvent(emptyKeyState, { type: 'down', code: 'KeyV' });
    expect(readControls(keys).colorMode).toBe(true);
  });
});
