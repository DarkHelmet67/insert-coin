import { describe, expect, it } from 'vitest';
import { createLeverTouch, leverFromPointer, type LeverElement } from './lever-touch';

/** A fake bar 200 pixels tall at the top of the page, with its listeners and style. */
const fakeBar = () => {
  const target = new EventTarget();
  const style = new Map<string, string>();
  const attributes = new Map<string, string>();
  const element = {
    addEventListener: (type: string, listener: (event: PointerEvent) => void) => {
      target.addEventListener(type, listener as EventListener);
    },
    getBoundingClientRect: () => ({ top: 0, height: 200 }),
    setPointerCapture: () => undefined,
    style: {
      setProperty: (name: string, value: string) => {
        style.set(name, value);
      },
    },
    setAttribute: (name: string, value: string) => {
      attributes.set(name, value);
    },
  } as unknown as LeverElement;
  /** A pointer event on the bar. */
  const touch = (type: string, clientY: number, buttons = 1): void => {
    target.dispatchEvent(Object.assign(new Event(type), { clientY, buttons, pointerId: 1 }));
  };
  return { element, touch, style, attributes };
};

describe('the touch lever', () => {
  it('reads the finger from the bottom of the bar', () => {
    expect(leverFromPointer(200, { top: 0, height: 200 })).toBe(0);
    expect(leverFromPointer(0, { top: 0, height: 200 })).toBe(255);
    expect(leverFromPointer(100, { top: 0, height: 200 })).toBe(128);
    expect(leverFromPointer(-50, { top: 0, height: 200 })).toBe(255);
    expect(leverFromPointer(10, { top: 0, height: 0 })).toBe(0);
  });

  it('reports a new position once, then nothing until the finger moves again', () => {
    const bar = fakeBar();
    const lever = createLeverTouch(bar.element);
    bar.touch('pointerdown', 50);
    expect(lever.poll()).toBe(191);
    expect(lever.poll()).toBeNull();
    bar.touch('pointermove', 50, 0);
    expect(lever.poll()).toBeNull();
  });

  it('shows the lever position on the bar', () => {
    const bar = fakeBar();
    createLeverTouch(bar.element).show(255);
    expect(bar.style.get('--lever')).toBe('1');
    expect(bar.attributes.get('aria-valuenow')).toBe('255');
  });

  it('does nothing without a bar', () => {
    const lever = createLeverTouch(null);
    lever.show(10);
    expect(lever.poll()).toBeNull();
  });
});
