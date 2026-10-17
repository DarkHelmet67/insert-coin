import type { HiScoreStore } from '@arcade/storage';

/**
 * The hi-score store to use: in debug mode the saved record is still shown, but a new one is
 * never written, so the real record is not spoiled by an immortal player or a late start.
 */
export const debugSafeHiScores = (store: HiScoreStore, debugOn: boolean): HiScoreStore =>
  debugOn ? { load: store.load, save: () => undefined } : store;
