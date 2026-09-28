/** The part of `localStorage` the store needs: a plain object can replace it in tests. */
export type ScoreStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** A saved hi-score for one game. */
export interface HiScoreStore {
  /** The saved record, or 0 if there is none or it cannot be read. */
  readonly load: () => number;
  /** Saves `score` if it beats the saved record; failures are ignored. */
  readonly save: (score: number) => void;
}

/**
 * Reads a saved score. Anything that is not a non-negative whole number (a missing key, a value
 * edited by hand in the browser tools) counts as "no record" instead of breaking the game.
 */
export const parseHiScore = (text: string | null): number => {
  const score = Number(text ?? '');
  return Number.isSafeInteger(score) && score > 0 ? score : 0;
};

/** Runs `action`, or returns `fallback` if it throws. */
const attempt = <T>(action: () => T, fallback: T): T => {
  try {
    return action();
  } catch {
    return fallback;
  }
};

/** The browser's `localStorage`, or `undefined` where even reading the property throws. */
const browserStorage = (): ScoreStorage | undefined =>
  attempt<ScoreStorage | undefined>(() => window.localStorage, undefined);

/**
 * Creates the hi-score store for the game saved under `key`.
 * Storage can fail in ordinary situations (private browsing, storage disabled, quota full):
 * a record that is not saved must never stop the game, so every access is guarded.
 */
export const createHiScoreStore = (
  key: string,
  storage: ScoreStorage | undefined = browserStorage(),
): HiScoreStore => {
  /** The saved record. */
  const load = (): number => attempt(() => parseHiScore(storage?.getItem(key) ?? null), 0);
  return {
    load,
    save: (score) => {
      if (score > load()) attempt(() => storage?.setItem(key, String(score)), undefined);
    },
  };
};
