import { describe, expect, it } from 'vitest';
import { createShields, damageShields, findHitShield, SHIELD_SPACING } from './shields';
import { shotExplosionSprite, shotSprite } from './sprites';

/** Lit pixels in a shield's bitmap. */
const solidPixels = (pixels: readonly boolean[]): number => pixels.filter(Boolean).length;

describe('shields', () => {
  it('creates four shields evenly spaced', () => {
    const shields = createShields();
    expect(shields).toHaveLength(4);
    expect((shields[1]?.x ?? 0) - (shields[0]?.x ?? 0)).toBe(SHIELD_SPACING);
  });

  it('finds the shield touched by an object, pixel by pixel', () => {
    const [first] = createShields();
    const x = first?.x ?? 0;
    expect(findHitShield(createShields(), { bitmap: shotSprite, x: x + 10, y: 200 })).toEqual(
      first,
    );
    // The top corners are cut: a shot there passes by.
    expect(findHitShield(createShields(), { bitmap: shotSprite, x, y: 186 })).toBeUndefined();
  });

  it('carves a hole only in the shield that was hit', () => {
    const shields = createShields();
    const x = shields[0]?.x ?? 0;
    const damaged = damageShields(shields, { bitmap: shotExplosionSprite, x: x + 7, y: 196 });
    expect(solidPixels(damaged[0]?.bitmap.pixels ?? [])).toBeLessThan(
      solidPixels(shields[0]?.bitmap.pixels ?? []),
    );
    expect(damaged[1]).toBe(shields[1]);
  });
});
