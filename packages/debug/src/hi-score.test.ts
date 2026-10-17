import { describe, expect, it, vi } from 'vitest';
import { debugSafeHiScores } from './hi-score';

/** A store with a saved record of 500 that records what it is asked to save. */
const fakeStore = () => ({ load: () => 500, save: vi.fn() });

describe('debugSafeHiScores', () => {
  it('saves new records in the normal game', () => {
    const store = fakeStore();
    debugSafeHiScores(store, false).save(900);
    expect(store.save).toHaveBeenCalledWith(900);
  });

  it('still shows the saved record in debug mode, but never writes a new one', () => {
    const store = fakeStore();
    const safe = debugSafeHiScores(store, true);
    safe.save(900);
    expect(safe.load()).toBe(500);
    expect(store.save).not.toHaveBeenCalled();
  });
});
