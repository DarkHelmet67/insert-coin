import { describe, expect, it } from 'vitest';
import { isDown, wasPressed, type KeyCode } from './key-state';
import { createTouchButtons, type KeyAt } from './touch-buttons';

/** Builds an event shaped like a browser `PointerEvent`, with the button under it in `key`. */
const pointerEvent = (type: string, pointerId: number, key?: KeyCode, buttons = 1): Event =>
  Object.assign(new Event(type, { cancelable: true }), { pointerId, key, buttons });

/** Fake `keyAt`: reads the button that `pointerEvent` stored on the event. */
const keyAt: KeyAt = (event) => (event as PointerEvent & { key?: KeyCode }).key;

/** A panel of fake buttons and the touch buttons listening to it. */
const setup = () => {
  const panel = new EventTarget();
  return { panel, buttons: createTouchButtons(panel, { keyAt }) };
};

describe('createTouchButtons', () => {
  it('reports a tap on a button as a key press in exactly one poll', () => {
    const { panel, buttons } = setup();

    panel.dispatchEvent(pointerEvent('pointerdown', 1, 'Space'));
    expect(wasPressed(buttons.poll(), 'Space')).toBe(true);
    const next = buttons.poll();
    expect(wasPressed(next, 'Space')).toBe(false);
    expect(isDown(next, 'Space')).toBe(true);
  });

  it('handles two fingers at once', () => {
    const { panel, buttons } = setup();

    panel.dispatchEvent(pointerEvent('pointerdown', 1, 'ArrowLeft'));
    panel.dispatchEvent(pointerEvent('pointerdown', 2, 'Space'));
    panel.dispatchEvent(pointerEvent('pointerup', 2));
    const state = buttons.poll();
    expect(isDown(state, 'ArrowLeft')).toBe(true);
    expect(isDown(state, 'Space')).toBe(false);
  });

  it('follows a thumb sliding from one button to another', () => {
    const { panel, buttons } = setup();

    panel.dispatchEvent(pointerEvent('pointerdown', 1, 'ArrowLeft'));
    panel.dispatchEvent(pointerEvent('pointermove', 1, 'ArrowRight'));
    const state = buttons.poll();
    expect(isDown(state, 'ArrowLeft')).toBe(false);
    expect(isDown(state, 'ArrowRight')).toBe(true);
  });

  it('ignores a mouse hovering over a button', () => {
    const { panel, buttons } = setup();

    panel.dispatchEvent(pointerEvent('pointermove', 1, 'Space', 0));
    expect(isDown(buttons.poll(), 'Space')).toBe(false);
  });

  it('releases the key when the system cancels the touch', () => {
    const { panel, buttons } = setup();

    panel.dispatchEvent(pointerEvent('pointerdown', 1, 'Space'));
    panel.dispatchEvent(pointerEvent('pointercancel', 1));
    expect(isDown(buttons.poll(), 'Space')).toBe(false);
  });

  it('blocks the browser gestures on the panel', () => {
    const { panel } = setup();
    const down = pointerEvent('pointerdown', 1, 'Space');
    const menu = new Event('contextmenu', { cancelable: true });

    panel.dispatchEvent(down);
    panel.dispatchEvent(menu);
    expect(down.defaultPrevented).toBe(true);
    expect(menu.defaultPrevented).toBe(true);
  });

  it('stops listening after dispose', () => {
    const { panel, buttons } = setup();

    buttons.dispose();
    panel.dispatchEvent(pointerEvent('pointerdown', 1, 'Space'));
    expect(isDown(buttons.poll(), 'Space')).toBe(false);
  });
});
