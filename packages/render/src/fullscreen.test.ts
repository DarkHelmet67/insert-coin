import { describe, expect, it, vi } from 'vitest';
import { enterFullscreenOnTouch, wantsFullscreen, type FullscreenDocument } from './fullscreen';

/** A fake document with a spy on `requestFullscreen` and a way to lift a pointer. */
const fakeDocument = (
  fullscreenEnabled = true,
  fullscreenElement: Element | null = null,
): {
  readonly doc: FullscreenDocument;
  readonly request: ReturnType<typeof vi.fn>;
  readonly lift: (pointerType: string) => void;
} => {
  const target = new EventTarget();
  const request = vi.fn(() => Promise.resolve());
  const doc: FullscreenDocument = {
    fullscreenEnabled,
    fullscreenElement,
    documentElement: { requestFullscreen: request },
    addEventListener: (type, listener) => {
      target.addEventListener(type, listener as EventListener);
    },
    removeEventListener: (type, listener) => {
      target.removeEventListener(type, listener as EventListener);
    },
  };
  /** Dispatches a `pointerup` with the given pointer type. */
  const lift = (pointerType: string): void => {
    target.dispatchEvent(Object.assign(new Event('pointerup'), { pointerType }));
  };
  return { doc, request, lift };
};

describe('wantsFullscreen', () => {
  it('asks for fullscreen for a finger when the browser allows it', () => {
    expect(wantsFullscreen('touch', fakeDocument().doc)).toBe(true);
  });

  it('never asks for the mouse', () => {
    expect(wantsFullscreen('mouse', fakeDocument().doc)).toBe(false);
  });

  it('does not ask where fullscreen is not available', () => {
    expect(wantsFullscreen('touch', fakeDocument(false).doc)).toBe(false);
  });

  it('does not ask again when the page is already fullscreen', () => {
    expect(wantsFullscreen('touch', fakeDocument(true, {} as Element).doc)).toBe(false);
  });
});

describe('enterFullscreenOnTouch', () => {
  it('requests fullscreen when a finger is lifted', () => {
    const { doc, request, lift } = fakeDocument();
    enterFullscreenOnTouch(doc);
    lift('touch');
    expect(request).toHaveBeenCalledWith({ navigationUI: 'hide' });
  });

  it('ignores the mouse', () => {
    const { doc, request, lift } = fakeDocument();
    enterFullscreenOnTouch(doc);
    lift('mouse');
    expect(request).not.toHaveBeenCalled();
  });

  // An unhandled rejection would make Vitest fail the run, so settling quietly is the check.
  it('swallows a refusal of the browser', async () => {
    const { doc, request, lift } = fakeDocument();
    request.mockImplementation(() => Promise.reject(new Error('denied')));
    enterFullscreenOnTouch(doc);
    lift('touch');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(request).toHaveBeenCalledOnce();
  });

  it('stops listening once disposed', () => {
    const { doc, request, lift } = fakeDocument();
    enterFullscreenOnTouch(doc)();
    lift('touch');
    expect(request).not.toHaveBeenCalled();
  });
});
