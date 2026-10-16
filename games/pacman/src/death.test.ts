import { describe, expect, it } from 'vitest';
import { DEATH_OVER, deathOver, deathSprite, ghostsGone, tickDeath } from './death';

describe('death', () => {
  it('stands still for one second, two updates per frame', () => {
    expect(ghostsGone(0x78)).toBe(false);
    expect(deathSprite(0x78)).toBeUndefined();
    expect(ghostsGone(0x79)).toBe(true);
  });

  it('shrinks Pac-Man through sprites $34-$3F', () => {
    expect(deathSprite(0x79)).toBe(0x34);
    expect(deathSprite(0xb4)).toBe(0x34);
    expect(deathSprite(0xb5)).toBe(0x35);
    expect(deathSprite(0x15a)).toBe(0x3f);
  });

  it('ends after $1B8 updates and stays over', () => {
    expect(deathOver(tickDeath(DEATH_OVER - 1))).toBe(true);
    expect(tickDeath(DEATH_OVER)).toBe(DEATH_OVER);
  });
});
