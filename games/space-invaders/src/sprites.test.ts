import { describe, expect, it } from 'vitest';
import { CANNON_WIDTH } from './cannon';
import { alienSprites, cannonSprite, ufoSprite } from './sprites';

describe('sprites', () => {
  it('have the sizes of the original game', () => {
    expect([
      alienSprites.squid[0].width,
      alienSprites.crab[0].width,
      alienSprites.octopus[0].width,
    ]).toEqual([8, 11, 12]);
    expect(ufoSprite.width).toBe(16);
  });

  it('keep the same size across animation frames', () => {
    Object.values(alienSprites).forEach(([a, b]) => {
      expect([b.width, b.height]).toEqual([a.width, a.height]);
    });
  });

  it('match the cannon width used by the movement logic', () => {
    expect(cannonSprite.width).toBe(CANNON_WIDTH);
  });
});
