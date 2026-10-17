import { describe, expect, it } from 'vitest';
import { isDown, wasPressed, wasReleased } from './key-state';
import type { StickDirections } from './stick-direction';
import { createVirtualJoystick, type JoystickElements } from './virtual-joystick';

/** Builds an event shaped like a browser `PointerEvent`. */
const pointerEvent = (type: string, pointerId: number, clientX = 0, clientY = 0): Event =>
  Object.assign(new Event(type, { cancelable: true }), { pointerId, clientX, clientY });

/** A fake joystick: a base 100 pixels wide centred on (100, 100), with the knob's style. */
const setup = (directions: StickDirections = 'four-way') => {
  const zone = Object.assign(new EventTarget(), {
    captured: [] as number[],
    setPointerCapture: (id: number) => {
      zone.captured.push(id);
    },
  });
  const style = new Map<string, string>();
  const elements = {
    zone,
    base: { getBoundingClientRect: () => ({ left: 50, top: 50, width: 100, height: 100 }) },
    knob: {
      style: {
        setProperty: (name: string, value: string) => {
          style.set(name, value);
        },
      },
    },
  } as unknown as JoystickElements;
  const stick = createVirtualJoystick(elements, { directions, deadZone: 0.3 });
  return { zone, style, stick };
};

describe('createVirtualJoystick', () => {
  it('holds the arrow the knob is pushed towards', () => {
    const { zone, stick } = setup();

    zone.dispatchEvent(pointerEvent('pointerdown', 1, 100, 30));
    const state = stick.poll();
    expect(wasPressed(state, 'ArrowUp')).toBe(true);
    expect(isDown(stick.poll(), 'ArrowUp')).toBe(true);
  });

  it('holds nothing when the finger lands on the centre', () => {
    const { zone, stick } = setup();

    zone.dispatchEvent(pointerEvent('pointerdown', 1, 105, 95));
    expect(stick.poll().down.size).toBe(0);
  });

  it('keeps the stick while the finger slides off the base', () => {
    const { zone, stick } = setup();

    zone.dispatchEvent(pointerEvent('pointerdown', 1, 100, 100));
    zone.dispatchEvent(pointerEvent('pointermove', 1, 400, 120));
    expect(isDown(stick.poll(), 'ArrowRight')).toBe(true);
    expect(zone.captured).toEqual([1]);
  });

  it('turns from one arrow to the next without lifting the finger', () => {
    const { zone, stick } = setup();

    zone.dispatchEvent(pointerEvent('pointerdown', 1, 30, 100));
    stick.poll();
    zone.dispatchEvent(pointerEvent('pointermove', 1, 100, 170));
    const state = stick.poll();
    expect(wasReleased(state, 'ArrowLeft')).toBe(true);
    expect(isDown(state, 'ArrowDown')).toBe(true);
  });

  it('springs back to the centre when the finger lifts', () => {
    const { zone, style, stick } = setup();

    zone.dispatchEvent(pointerEvent('pointerdown', 1, 150, 100));
    zone.dispatchEvent(pointerEvent('pointerup', 1));
    expect(isDown(stick.poll(), 'ArrowRight')).toBe(false);
    expect(style.get('--stick-x')).toBe('0.000');
  });

  it('ignores a second finger while the first holds the stick', () => {
    const { zone, stick } = setup();

    zone.dispatchEvent(pointerEvent('pointerdown', 1, 30, 100));
    zone.dispatchEvent(pointerEvent('pointerdown', 2, 170, 100));
    zone.dispatchEvent(pointerEvent('pointerup', 2));
    const state = stick.poll();
    expect(isDown(state, 'ArrowLeft')).toBe(true);
    expect(isDown(state, 'ArrowRight')).toBe(false);
  });

  it('moves a sideways knob only along its axis', () => {
    const { zone, style, stick } = setup('left-right');

    zone.dispatchEvent(pointerEvent('pointerdown', 1, 150, 150));
    expect(isDown(stick.poll(), 'ArrowRight')).toBe(true);
    expect(style.get('--stick-y')).toBe('0.000');
  });

  it('stops listening after dispose', () => {
    const { zone, stick } = setup();

    stick.dispose();
    zone.dispatchEvent(pointerEvent('pointerdown', 1, 100, 30));
    expect(stick.poll().down.size).toBe(0);
  });
});
