import { describe, expect, it } from 'vitest';
import { EXPLOSION_DURATION, explodeAlien, updateExplosions } from './explosions';

describe('explosions', () => {
  it('are centered on the invader', () => {
    expect(explodeAlien({ kind: 'crab', x: 100, y: 50 })).toMatchObject({ x: 99, y: 50 });
  });

  it('disappear after their duration', () => {
    const explosion = explodeAlien({ kind: 'crab', x: 0, y: 0 });
    expect(updateExplosions([explosion], EXPLOSION_DURATION / 2)).toHaveLength(1);
    expect(updateExplosions([explosion], EXPLOSION_DURATION)).toHaveLength(0);
  });
});
