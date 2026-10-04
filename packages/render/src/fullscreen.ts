/** The part of `document` the fullscreen helpers need; a plain fake in tests. */
export interface FullscreenDocument {
  /** False where the page cannot go fullscreen (e.g. Safari on iPhone). */
  readonly fullscreenEnabled: boolean;
  /** The element shown fullscreen, `null` when the page is in its normal window. */
  readonly fullscreenElement: Element | null;
  /** The element to show fullscreen: the whole page, so the touch panel stays visible. */
  readonly documentElement: Pick<Element, 'requestFullscreen'>;
  /** Where to listen for the finger lifted from the screen, and for fullscreen changes. */
  readonly addEventListener: (type: 'touchend' | 'fullscreenchange', listener: () => void) => void;
  /** Stops listening. */
  readonly removeEventListener: (
    type: 'touchend' | 'fullscreenchange',
    listener: () => void,
  ) => void;
}

/** True when the page can go fullscreen and is not fullscreen yet. */
export const wantsFullscreen = (doc: FullscreenDocument): boolean =>
  doc.fullscreenEnabled && doc.fullscreenElement === null;

/**
 * Shows the whole page fullscreen, hiding the browser's bars. It works only while the browser
 * counts a gesture of the user (a tap, a click, a key): outside one the browser refuses, and a
 * refusal is not an error for the game, so it is ignored.
 */
export const enterFullscreen = (doc: FullscreenDocument = document): void => {
  if (!wantsFullscreen(doc)) return;
  doc.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => undefined);
};

/**
 * On touch screens, every finger lifted from the screen asks for fullscreen until the page gets
 * it: the first touch hides the browser's bars, and after leaving fullscreen the next one brings
 * it back. It listens to `touchend`, which only fingers produce, so the mouse never triggers it.
 * Chrome for Android grants the gesture to `touchend`, not to the `pointerup` just before it.
 * Where the API is missing (Safari on iPhone) nothing happens: there the page goes fullscreen
 * when added to the home screen (see the web app manifest).
 * @returns A function that removes the listener.
 */
export const enterFullscreenOnTouch = (doc: FullscreenDocument = document): (() => void) => {
  /** A finger was lifted: a valid gesture for the browser. */
  const onTouchEnd = (): void => {
    enterFullscreen(doc);
  };
  doc.addEventListener('touchend', onTouchEnd);
  return () => {
    doc.removeEventListener('touchend', onTouchEnd);
  };
};
