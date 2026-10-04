import { describe, expect, it, vi } from 'vitest';
import type { FullscreenDocument } from './fullscreen';
import { showFullscreenButton, type FullscreenButton } from './fullscreen-button';

/** A fake document whose fullscreen state the test can change. */
const fakeDocument = (fullscreenEnabled: boolean) => {
  const target = new EventTarget();
  const request = vi.fn(() => Promise.resolve());
  const state = { element: null as Element | null };
  const doc: FullscreenDocument = Object.defineProperty(
    {
      fullscreenEnabled,
      fullscreenElement: null,
      documentElement: { requestFullscreen: request },
      addEventListener: (type: 'touchend' | 'fullscreenchange', listener: () => void) => {
        target.addEventListener(type, listener);
      },
      removeEventListener: (type: 'touchend' | 'fullscreenchange', listener: () => void) => {
        target.removeEventListener(type, listener);
      },
    },
    'fullscreenElement',
    { get: () => state.element },
  );
  /** The page goes fullscreen (or back), as the browser would announce it. */
  const setFullscreen = (on: boolean): void => {
    state.element = on ? ({} as Element) : null;
    target.dispatchEvent(new Event('fullscreenchange'));
  };
  return { doc, request, setFullscreen };
};

/** A fake button that records whether it is hidden. */
const fakeButton = () => {
  const target = new EventTarget();
  const state = { hidden: true };
  const button: FullscreenButton = {
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
      target.addEventListener(type, listener);
    },
    toggleAttribute: (_name: string, force?: boolean) => {
      state.hidden = force ?? !state.hidden;
      return state.hidden;
    },
  };
  return { button, state, click: () => target.dispatchEvent(new Event('click')) };
};

describe('showFullscreenButton', () => {
  it('shows the button and asks for fullscreen when clicked', () => {
    const { doc, request } = fakeDocument(true);
    const { button, state, click } = fakeButton();
    showFullscreenButton(button, doc);
    expect(state.hidden).toBe(false);
    click();
    expect(request).toHaveBeenCalledOnce();
  });

  it('hides the button while the page is fullscreen', () => {
    const { doc, setFullscreen } = fakeDocument(true);
    const { button, state } = fakeButton();
    showFullscreenButton(button, doc);
    setFullscreen(true);
    expect(state.hidden).toBe(true);
    setFullscreen(false);
    expect(state.hidden).toBe(false);
  });

  it('leaves the button hidden where the browser cannot go fullscreen', () => {
    const { doc } = fakeDocument(false);
    const { button, state } = fakeButton();
    showFullscreenButton(button, doc);
    expect(state.hidden).toBe(true);
  });
});
