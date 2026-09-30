/** The part of `document` the fullscreen helper needs; a plain fake in tests. */
export interface FullscreenDocument {
  /** False where the page cannot go fullscreen (e.g. Safari on iPhone). */
  readonly fullscreenEnabled: boolean;
  /** The element shown fullscreen, `null` when the page is in its normal window. */
  readonly fullscreenElement: Element | null;
  /** The element to show fullscreen: the whole page, so the touch panel stays visible. */
  readonly documentElement: Pick<Element, 'requestFullscreen'>;
  /** Where to listen for the finger lifted from the screen. */
  readonly addEventListener: (type: 'pointerup', listener: (event: PointerEvent) => void) => void;
  /** Stops listening. */
  readonly removeEventListener: (type: 'pointerup', listener: (event: PointerEvent) => void) => void;
}

/**
 * True when a lifted pointer should take the page fullscreen: a finger or a pen (never the mouse,
 * a desktop player keeps the window as it is), a browser that allows it, a page not fullscreen yet.
 */
export const wantsFullscreen = (pointerType: string, doc: FullscreenDocument): boolean =>
  pointerType !== 'mouse' && doc.fullscreenEnabled && doc.fullscreenElement === null;

/**
 * On touch screens, the first touch hides the browser's bars by showing the page fullscreen.
 * Browsers allow fullscreen only as the answer to a gesture of the user, and a finger counts as
 * a gesture when it is lifted (`pointerup`), not when it lands. If the player leaves fullscreen,
 * the next touch brings it back. Where the API is missing (Safari on iPhone) nothing happens:
 * there the page goes fullscreen when added to the home screen (see the web app manifest).
 * @returns A function that removes the listener.
 */
export const enterFullscreenOnTouch = (doc: FullscreenDocument = document): (() => void) => {
  /** A finger was lifted: ask for fullscreen if it makes sense. A refusal is not an error. */
  const onUp = (event: PointerEvent): void => {
    if (!wantsFullscreen(event.pointerType, doc)) return;
    doc.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => undefined);
  };
  doc.addEventListener('pointerup', onUp);
  return () => {
    doc.removeEventListener('pointerup', onUp);
  };
};
