import { describe, expect, it } from 'vitest';
import { createEffect, EFFECT_FRAMES, explodeAlien, stepEffects, type Effect } from './effects';
import { alienAt } from './test-fixtures';

describe('effects', () => {
  it('centers the explosion on the invader', () => {
    expect(explodeAlien(alienAt(100, 50, 'squid'))).toMatchObject({ kind: 'alien', x: 97, y: 50 });
  });

  it('keeps the points of the mystery ship', () => {
    expect(createEffect('ufo', 10, 40, 300).points).toBe(300);
  });

  it('disappears after its frames have elapsed', () => {
    const effects = [createEffect('shot', 0, 0)];
    const aged = Array.from({ length: EFFECT_FRAMES.shot - 1 }).reduce<readonly Effect[]>(
      (current) => stepEffects(current),
      effects,
    );
    expect(aged).toHaveLength(1);
    expect(stepEffects(aged)).toEqual([]);
  });
});
