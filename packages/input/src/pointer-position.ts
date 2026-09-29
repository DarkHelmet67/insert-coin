/** The part of an element's bounding box needed to convert page coordinates. */
export interface HorizontalBounds {
  readonly left: number;
  readonly width: number;
}

/**
 * Converts a pointer's page x into the game's own units: 0 at the left edge of the canvas,
 * `logicalWidth` at the right edge, whatever size CSS gives the canvas on screen.
 * Positions outside the canvas are kept (below 0 or above the width): the game clamps them.
 */
export const toLogicalX = (
  clientX: number,
  bounds: HorizontalBounds,
  logicalWidth: number,
): number => ((clientX - bounds.left) / bounds.width) * logicalWidth;

/** Where pointer events come from: `window` in the browser, a plain `EventTarget` in tests. */
export type PointerTarget = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

/** Options for `createPointerPosition`. */
export interface PointerPositionOptions {
  /** Where to listen: the whole page by default, so the pointer works outside the canvas too. */
  readonly target?: PointerTarget;
  /** The canvas's current position on the page; replaced by a fake in tests. */
  readonly bounds: () => HorizontalBounds;
  /** Width of the canvas in game units. */
  readonly logicalWidth: number;
}

/** Live horizontal position of the mouse or finger, polled like a keyboard. */
export interface PointerPosition {
  /** The pointer's x in game units if it moved since the previous poll, otherwise `undefined`. */
  readonly poll: () => number | undefined;
  /** Removes the event listeners. */
  readonly dispose: () => void;
}

/**
 * Follows the horizontal position of the mouse or of a finger, as an absolute position: the
 * same kind of control as a knob on a potentiometer, where each angle is one place on screen.
 * A mouse counts when it moves; a finger when it touches or slides.
 */
export const createPointerPosition = ({
  target = window,
  bounds,
  logicalWidth,
}: PointerPositionOptions): PointerPosition => {
  let latest: number | undefined;

  /** Records where the pointer is, in game units. */
  const onPointer = (event: Event): void => {
    latest = toLogicalX((event as PointerEvent).clientX, bounds(), logicalWidth);
  };

  target.addEventListener('pointermove', onPointer);
  target.addEventListener('pointerdown', onPointer);

  return {
    poll: () => {
      const current = latest;
      latest = undefined;
      return current;
    },
    dispose: () => {
      target.removeEventListener('pointermove', onPointer);
      target.removeEventListener('pointerdown', onPointer);
    },
  };
};
