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

/** What the pointer did since the previous poll. */
export interface PointerSnapshot {
  /** The pointer's x in game units if it moved, otherwise `undefined`. */
  readonly x: number | undefined;
  /** Whether a mouse button was clicked or a finger touched the screen. */
  readonly pressed: boolean;
}

/** Live horizontal position of the mouse or finger, polled like a keyboard. */
export interface PointerPosition {
  /** What the pointer did since the previous poll. Call it once per update. */
  readonly poll: () => PointerSnapshot;
  /** Removes the event listeners. */
  readonly dispose: () => void;
}

/**
 * Follows the horizontal position of the mouse or of a finger, as an absolute position: the
 * same kind of control as a knob on a potentiometer, where each angle is one place on screen.
 * A mouse counts when it moves; a finger when it touches or slides. Clicks and touches are
 * reported too, as a press: a game can use them as a button.
 */
export const createPointerPosition = ({
  target = window,
  bounds,
  logicalWidth,
}: PointerPositionOptions): PointerPosition => {
  let latest: number | undefined;
  let pressed = false;

  /** Records where the pointer is, in game units. */
  const onMove = (event: Event): void => {
    latest = toLogicalX((event as PointerEvent).clientX, bounds(), logicalWidth);
  };
  /** A click or a touch: it also moves the pointer there. */
  const onDown = (event: Event): void => {
    onMove(event);
    pressed = true;
  };

  target.addEventListener('pointermove', onMove);
  target.addEventListener('pointerdown', onDown);

  return {
    poll: () => {
      const snapshot = { x: latest, pressed };
      latest = undefined;
      pressed = false;
      return snapshot;
    },
    dispose: () => {
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerdown', onDown);
    },
  };
};
