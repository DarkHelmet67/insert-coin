import { describe, expect, it } from 'vitest';
import { createHiScoreStore, parseHiScore, type ScoreStorage } from './hi-score';

/** An in-memory stand-in for `localStorage`. */
const memoryStorage = (initial: Record<string, string> = {}): ScoreStorage => {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value);
    },
  };
};

/** A storage that throws on every access, like Safari with storage disabled. */
const brokenStorage: ScoreStorage = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
};

describe('parseHiScore', () => {
  it('reads a saved whole number', () => {
    expect(parseHiScore('1250')).toBe(1250);
  });

  it('treats missing or invalid values as no record', () => {
    expect(parseHiScore(null)).toBe(0);
    expect(parseHiScore('')).toBe(0);
    expect(parseHiScore('abc')).toBe(0);
    expect(parseHiScore('-5')).toBe(0);
    expect(parseHiScore('12.5')).toBe(0);
  });
});

describe('createHiScoreStore', () => {
  it('starts from 0 when nothing is saved', () => {
    expect(createHiScoreStore('game', memoryStorage()).load()).toBe(0);
  });

  it('saves a better score and keeps the best one', () => {
    const store = createHiScoreStore('game', memoryStorage());
    store.save(800);
    store.save(300);
    expect(store.load()).toBe(800);
  });

  it('keeps each game under its own key', () => {
    const storage = memoryStorage({ other: '9990' });
    expect(createHiScoreStore('game', storage).load()).toBe(0);
  });

  it('never throws when the storage is unavailable', () => {
    const store = createHiScoreStore('game', brokenStorage);
    expect(() => {
      store.save(100);
    }).not.toThrow();
    expect(store.load()).toBe(0);
    expect(createHiScoreStore('game', undefined).load()).toBe(0);
  });
});
