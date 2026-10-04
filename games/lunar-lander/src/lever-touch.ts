import { LEVER_MAX } from './thrust';

/**
 * The thrust lever on a touch screen: a tall bar the finger slides along, up for more thrust.
 * Like the real lever it stays where the finger leaves it. An imperative adapter, like the
 * keyboard: the position lives in a closure and the game polls it once per frame.
 */

/** The part of the bar's box that matters: where it starts and how tall it is, in pixels. */
export interface LeverBox {
  readonly top: number;
  readonly height: number;
}

/** The lever position, 0 to 255, for a finger at `clientY` on a bar placed at `box`. */
export const leverFromPointer = (clientY: number, box: LeverBox): number => {
  if (box.height <= 0) return 0;
  const fromBottom = (box.top + box.height - clientY) / box.height;
  return Math.round(Math.max(0, Math.min(1, fromBottom)) * LEVER_MAX);
};

/** The bar in the page: its events and its box. */
export type LeverElement = Pick<
  HTMLElement,
  'addEventListener' | 'getBoundingClientRect' | 'setPointerCapture' | 'style' | 'setAttribute'
>;

/** A touch lever, polled once per frame. */
export interface LeverTouch {
  /** Where the finger put the lever since the last poll, or null if it was not moved. */
  readonly poll: () => number | null;
  /** Shows the lever at `lever` (also when the keyboard moved it). */
  readonly show: (lever: number) => void;
}

/** Makes `element` a thrust lever; without an element (no touch panel) it never moves. */
export const createLeverTouch = (element: LeverElement | null): LeverTouch => {
  let moved: number | null = null;
  let shown = -1;

  /** The finger touches or slides on the bar. */
  const follow = (event: PointerEvent): void => {
    if (event.type === 'pointerdown' && element) element.setPointerCapture(event.pointerId);
    if (event.type === 'pointermove' && event.buttons === 0) return;
    const box = element?.getBoundingClientRect();
    if (box) moved = leverFromPointer(event.clientY, box);
  };
  element?.addEventListener('pointerdown', follow);
  element?.addEventListener('pointermove', follow);

  return {
    poll: () => {
      const value = moved;
      moved = null;
      return value;
    },
    show: (lever) => {
      if (!element || lever === shown) return;
      shown = lever;
      element.style.setProperty('--lever', String(lever / LEVER_MAX));
      element.setAttribute('aria-valuenow', String(lever));
    },
  };
};
