import { describe, expect, it } from 'vitest';
import { createPointerPosition, toLogicalX } from './pointer-position';

/** Builds an event shaped like a browser `PointerEvent`. */
const pointerEvent = (type: string, clientX: number): Event =>
  Object.assign(new Event(type), { clientX });

/** A canvas 228 units wide, shown 456 pixels wide starting 100 pixels from the left. */
const setup = () => {
  const target = new EventTarget();
  const pointer = createPointerPosition({
    target,
    bounds: () => ({ left: 100, width: 456 }),
    logicalWidth: 228,
  });
  return { target, pointer };
};

describe('toLogicalX', () => {
  it('maps the canvas edges to 0 and the logical width', () => {
    const bounds = { left: 100, width: 456 };
    expect(toLogicalX(100, bounds, 228)).toBe(0);
    expect(toLogicalX(556, bounds, 228)).toBe(228);
    expect(toLogicalX(328, bounds, 228)).toBe(114);
  });

  it('keeps positions outside the canvas', () => {
    expect(toLogicalX(0, { left: 100, width: 456 }, 228)).toBe(-50);
  });
});

describe('createPointerPosition', () => {
  it('reports the latest position once, then nothing until the pointer moves again', () => {
    const { target, pointer } = setup();

    target.dispatchEvent(pointerEvent('pointermove', 200));
    target.dispatchEvent(pointerEvent('pointermove', 328));
    expect(pointer.poll()).toEqual({ x: 114, pressed: false });
    expect(pointer.poll()).toEqual({ x: undefined, pressed: false });
  });

  it('follows a finger touching the screen and reports the touch as a press, once', () => {
    const { target, pointer } = setup();

    target.dispatchEvent(pointerEvent('pointerdown', 100));
    expect(pointer.poll()).toEqual({ x: 0, pressed: true });
    expect(pointer.poll().pressed).toBe(false);
  });

  it('stops listening after dispose', () => {
    const { target, pointer } = setup();

    pointer.dispose();
    target.dispatchEvent(pointerEvent('pointerdown', 328));
    expect(pointer.poll()).toEqual({ x: undefined, pressed: false });
  });
});
