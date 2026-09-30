import { enterFullscreen } from '@arcade/render';

/**
 * Wires the panel's "fullscreen" button, for players whose first touch did not get it. The button
 * shows only where the browser can go fullscreen, and hides while the page is fullscreen: the
 * way back is the phone's own "back" gesture. It only enters, never leaves, so the same tap
 * cannot enter (through the touch listener) and then leave again (through the click).
 * This is part of the imperative shell: showing and hiding a button is a change to the page.
 */
export const showFullscreenButton = (button: HTMLButtonElement | null): void => {
  if (!button || !document.fullscreenEnabled) return;
  /** Shows the button only while the page is in its normal window. */
  const refresh = (): void => {
    button.toggleAttribute('hidden', document.fullscreenElement !== null);
  };
  button.addEventListener('click', () => {
    enterFullscreen();
  });
  document.addEventListener('fullscreenchange', refresh);
  refresh();
};
