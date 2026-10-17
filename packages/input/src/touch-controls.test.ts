import { describe, expect, it } from 'vitest';
import { isDown } from './key-state';
import { createTouchControls, findJoystick, type TouchPanel } from './touch-controls';

/** A fake element: listeners, a style, and the children found by selector. */
const fakeElement = (children: Readonly<Record<string, unknown>> = {}) => {
  const attributes = new Map<string, string>();
  return Object.assign(new EventTarget(), {
    attributes,
    setAttribute: (name: string, value: string) => {
      attributes.set(name, value);
    },
    querySelector: (selector: string) => children[selector] ?? null,
    setPointerCapture: () => undefined,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    style: { setProperty: () => undefined },
  });
};

/** A panel with a complete joystick inside, or without it. */
const fakePanel = (withJoystick: boolean) => {
  const zone = fakeElement({ '.stick-base': fakeElement(), '.stick-knob': fakeElement() });
  const panel = fakeElement(withJoystick ? { '[data-joystick]': zone } : {});
  return { panel, zone };
};

/** A finger on the joystick zone, at (x, y) on a base of 100 × 100 pixels at the top left. */
const touch = (zone: EventTarget, x: number, y: number): void => {
  zone.dispatchEvent(
    Object.assign(new Event('pointerdown', { cancelable: true }), {
      pointerId: 1,
      clientX: x,
      clientY: y,
    }),
  );
};

describe('findJoystick', () => {
  it('finds the zone, the base and the knob', () => {
    expect(findJoystick(fakePanel(true).panel)).not.toBeNull();
  });

  it('gives up when a part is missing', () => {
    expect(findJoystick(fakePanel(false).panel)).toBeNull();
    const zone = fakeElement({ '.stick-base': fakeElement() });
    expect(findJoystick(fakeElement({ '[data-joystick]': zone }))).toBeNull();
  });
});

describe('createTouchControls', () => {
  it('uses the joystick when asked, and marks the panel', () => {
    const { panel, zone } = fakePanel(true);
    const controls = createTouchControls(
      panel as unknown as TouchPanel,
      { movement: 'joystick', deadZone: 0.3 },
      'left-right',
    );

    touch(zone, 0, 50);
    expect(isDown(controls.poll(), 'ArrowLeft')).toBe(true);
    expect(panel.attributes.get('data-touch-controls')).toBe('joystick');
  });

  it('keeps the arrow buttons when asked', () => {
    const { panel, zone } = fakePanel(true);
    const controls = createTouchControls(
      panel as unknown as TouchPanel,
      { movement: 'arrows', deadZone: 0.3 },
      'left-right',
    );

    touch(zone, 0, 50);
    expect(isDown(controls.poll(), 'ArrowLeft')).toBe(false);
    expect(panel.attributes.get('data-touch-controls')).toBe('arrows');
  });

  it('falls back to the arrows on a page without a joystick', () => {
    const { panel } = fakePanel(false);
    createTouchControls(
      panel as unknown as TouchPanel,
      { movement: 'joystick', deadZone: 0.3 },
      'four-way',
    );

    expect(panel.attributes.get('data-touch-controls')).toBe('arrows');
  });
});
