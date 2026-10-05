import { describe, expect, it } from 'vitest';
import { LARGE_MODULES, SMALL_MODULES } from './module-shapes';
import { moduleView } from './module-view';

describe('the ROM drawings', () => {
  it('has 9 drawings of each size', () => {
    expect(LARGE_MODULES).toHaveLength(9);
    expect(SMALL_MODULES).toHaveLength(9);
  });

  it('draws the upright large module with its feet at y = -18', () => {
    const upright = LARGE_MODULES[8] ?? [];
    const ys = upright.reduce<readonly number[]>(
      (acc, [, dy]) => [...acc, (acc.at(-1) ?? 0) + dy],
      [],
    );
    expect(Math.min(...ys)).toBe(-18);
  });
});

describe('moduleView', () => {
  it('uses the ROM drawings as they are for 0-8', () => {
    expect(moduleView(0)).toEqual({ drawing: 0, flipX: false, flipY: false });
    expect(moduleView(8)).toEqual({ drawing: 8, flipX: false, flipY: false });
  });

  it('mirrors the other three quarters of the turn', () => {
    expect(moduleView(9)).toEqual({ drawing: 7, flipX: true, flipY: false });
    expect(moduleView(16)).toEqual({ drawing: 0, flipX: true, flipY: true });
    expect(moduleView(24)).toEqual({ drawing: 8, flipX: true, flipY: true });
    expect(moduleView(25)).toEqual({ drawing: 7, flipX: false, flipY: true });
    expect(moduleView(31)).toEqual({ drawing: 1, flipX: false, flipY: true });
  });

  it('wraps around a full turn', () => {
    expect(moduleView(32)).toEqual(moduleView(0));
    expect(moduleView(-1)).toEqual(moduleView(31));
  });
});
