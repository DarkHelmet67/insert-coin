import { describe, expect, it } from 'vitest';
import { alienFrame, initialAttractState, isInsertCoinVisible, updateAttract } from './attract';

describe('attract screen', () => {
  it('advances time without modifying the previous state', () => {
    const next = updateAttract(initialAttractState, 0.5);
    expect(next.time).toBe(0.5);
    expect(initialAttractState.time).toBe(0);
  });

  it('shows "INSERT COIN" for the first half of each second', () => {
    expect(isInsertCoinVisible({ time: 0.2 })).toBe(true);
    expect(isInsertCoinVisible({ time: 0.7 })).toBe(false);
    expect(isInsertCoinVisible({ time: 1.2 })).toBe(true);
  });

  it('alternates the invader animation frame every half second', () => {
    expect([0.1, 0.6, 1.1, 1.6].map((time) => alienFrame({ time }))).toEqual([0, 1, 0, 1]);
  });
});
