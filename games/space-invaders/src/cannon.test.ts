import { describe, expect, it } from 'vitest';
import { CANNON_MAX_X, CANNON_MIN_X, CANNON_SPEED, moveCannon } from './cannon';

describe('moveCannon', () => {
  it('moves at the original speed', () => {
    expect(moveCannon({ x: 100 }, 1, 0.5).x).toBe(100 + CANNON_SPEED / 2);
    expect(moveCannon({ x: 100 }, -1, 0.5).x).toBe(100 - CANNON_SPEED / 2);
  });

  it('stops at the screen edges', () => {
    expect(moveCannon({ x: CANNON_MIN_X }, -1, 1).x).toBe(CANNON_MIN_X);
    expect(moveCannon({ x: CANNON_MAX_X }, 1, 1).x).toBe(CANNON_MAX_X);
  });
});
