import { bitmapsOverlap, eraseBitmap, type Bitmap, type PlacedBitmap } from '@arcade/collision';
import { shieldSprite } from './sprites';

/** One shield: its position and its current, possibly damaged, shape. */
export interface Shield {
  readonly x: number;
  readonly y: number;
  readonly bitmap: Bitmap;
}

/** Top edge of the shields, and left edge of the first one. */
export const SHIELD_Y = 192;
export const FIRST_SHIELD_X = 32;

/** Distance between the left edges of two shields: 22 pixels of shield plus 23 of gap. */
export const SHIELD_SPACING = 45;

/** The four intact shields of a new round. */
export const createShields = (): readonly Shield[] =>
  Array.from({ length: 4 }, (_, index) => ({
    x: FIRST_SHIELD_X + index * SHIELD_SPACING,
    y: SHIELD_Y,
    bitmap: shieldSprite,
  }));

/** The first shield touched by `object`, if any, with pixel-perfect precision. */
export const findHitShield = (
  shields: readonly Shield[],
  object: PlacedBitmap,
): Shield | undefined => shields.find((shield) => bitmapsOverlap(shield, object));

/** Carves `brush` out of every shield it touches: shields crumble a little at every hit. */
export const damageShields = (shields: readonly Shield[], brush: PlacedBitmap): readonly Shield[] =>
  shields.map((shield) =>
    bitmapsOverlap(shield, brush) ? { ...shield, bitmap: eraseBitmap(shield, brush) } : shield,
  );
