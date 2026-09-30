import { describe, expect, it, vi } from 'vitest';
import {
  enterFullscreen,
  enterFullscreenOnTouch,
  wantsFullscreen,
  type FullscreenDocument,
} from './fullscreen';

/** A fake document with a spy on `requestFullscreen` and a way to lift a finger. */
const fakeDocument = (
  fullscreenEnabled = true,
  fullscreenElement: Element | null = null,
): {
  readonly doc: FullscreenDocument;
  readonly request: ReturnType<typeof vi.fn>;
  readonly lift: () => void;
} => {
  const target = new EventTarget();
  const request = vi.fn(() => Promise.resolve());
  const doc: FullscreenDocument = {
    fullscreenEnabled,
    fullscreenElement,
    documentElement: { requestFullscreen: request },
    addEventListener: (type, listener) => {
      target.addEventListener(type, listener);
    },
    removeEventListener: (type, listener) => {
      target.removeEventListener(type, listener);
    },
  };
  /** Dispatches a `touchend`, as a finger leaving the screen. */
  const lift = (): void => {
    target.dispatchEvent(new Event('touchend'));
  };
  return { doc, request, lift };
};

/** Something shown fullscreen, for a fake document that is already fullscreen. */
const shown = {} as Element;

describe('wantsFullscreen', () => {
  it('is true when the browser allows it and the page is in its window', () => {
    expect(wantsFullscreen(fakeDocument().doc)).toBe(true);
  });

  it('is false where fullscreen is not available', () => {
    expect(wantsFullscreen(fakeDocument(false).doc)).toBe(false);
  });

  it('is false when the page is already fullscreen', () => {
    expect(wantsFullscreen(fakeDocument(true, shown).doc)).toBe(false);
  });
});

describe('enterFullscreen', () => {
  it('asks for the whole page without the navigation bar', () => {
    const { doc, request } = fakeDocument();
    enterFullscreen(doc);
    expect(request).toHaveBeenCalledWith({ navigationUI: 'hide' });
  });

  it('does not ask where fullscreen is not available', () => {
    const { doc, request } = fakeDocument(false);
    enterFullscreen(doc);
    expect(request).not.toHaveBeenCalled();
  });

  // An unhandled rejection would make Vitest fail the run, so settling quietly is the check.
  it('swallows a refusal of the browser', async () => {
    const { doc, request } = fakeDocument();
    request.mockImplementation(() => Promise.reject(new Error('denied')));
    enterFullscreen(doc);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(request).toHaveBeenCalledOnce();
  });
});

describe('enterFullscreenOnTouch', () => {
  it('asks for fullscreen when a finger is lifted', () => {
    const { doc, request, lift } = fakeDocument();
    enterFullscreenOnTouch(doc);
    lift();
    expect(request).toHaveBeenCalledOnce();
  });

  it('stops listening once disposed', () => {
    const { doc, request, lift } = fakeDocument();
    enterFullscreenOnTouch(doc)();
    lift();
    expect(request).not.toHaveBeenCalled();
  });
});
