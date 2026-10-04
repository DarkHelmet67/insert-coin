import { enterFullscreen, type FullscreenDocument } from './fullscreen';

/** The part of a `<button>` the fullscreen button needs; a plain fake in tests. */
export type FullscreenButton = Pick<HTMLButtonElement, 'addEventListener' | 'toggleAttribute'>;

/**
 * Wires a "fullscreen" button, for players whose first touch did not get it. The button shows
 * only where the browser can go fullscreen, and hides while the page is fullscreen: the way back
 * is the phone's own "back" gesture. It only enters, never leaves, so the same tap cannot enter
 * (through the touch listener) and then leave again (through the click).
 * This is part of the imperative shell: showing and hiding a button is a change to the page.
 * Born in Asteroids, shared since Lunar Lander.
 */
export const showFullscreenButton = (
  button: FullscreenButton | null,
  doc: FullscreenDocument = document,
): void => {
  if (!button || !doc.fullscreenEnabled) return;
  /** Shows the button only while the page is in its normal window. */
  const refresh = (): void => {
    button.toggleAttribute('hidden', doc.fullscreenElement !== null);
  };
  button.addEventListener('click', () => {
    enterFullscreen(doc);
  });
  doc.addEventListener('fullscreenchange', refresh);
  refresh();
};
