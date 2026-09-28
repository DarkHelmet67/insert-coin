import { describe, expect, it } from 'vitest';
import { initialAttractState, isInsertCoinVisible, updateAttract } from './attract';

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
});
