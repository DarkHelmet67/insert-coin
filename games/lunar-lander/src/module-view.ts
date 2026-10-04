import type { VectorShape } from '@arcade/vector';
import { LARGE_MODULES, SMALL_MODULES } from './module-shapes';

/**
 * The orientation of the module: 0 to 31, one step every 11.25 degrees [P SHIP]. 8 is upright,
 * 0 lies on its left side (the thrust pushes to the right), 16 on its right side (thrust to the
 * left), 24 is upside down. Higher numbers turn counterclockwise.
 */
export type Orientation = number;

/** Number of orientations in a full turn. */
export const ORIENTATIONS = 32;

/** The upright orientation: the only one, with its two neighbours, that can land [P SCAPLND]. */
export const UPRIGHT = 8;

/** Which of the 9 ROM drawings shows an orientation, and how to flip it. */
export interface ModuleView {
  readonly drawing: number;
  readonly flipX: boolean;
  readonly flipY: boolean;
}

/**
 * The ROM drawing and the flips of an orientation [P MODULE]: the ROM draws a quarter of a turn,
 * from 0 to 8; 9-15 are 7-1 mirrored left to right, 16-24 are 0-8 turned upside down (both
 * flips), 25-31 are 7-1 mirrored top to bottom.
 */
export const moduleView = (orientation: Orientation): ModuleView => {
  const o = ((orientation % ORIENTATIONS) + ORIENTATIONS) % ORIENTATIONS;
  if (o <= 8) return { drawing: o, flipX: false, flipY: false };
  if (o < 16) return { drawing: 16 - o, flipX: true, flipY: false };
  if (o <= 24) return { drawing: o - 16, flipX: true, flipY: true };
  return { drawing: 32 - o, flipX: false, flipY: true };
};

/** The two sizes of the module: large at full zoom, small in the distant view. */
export type ModuleSize = 'large' | 'small';

/** The ROM drawing of one size. */
export const moduleShape = (size: ModuleSize, drawing: number): VectorShape =>
  (size === 'large' ? LARGE_MODULES : SMALL_MODULES)[drawing] ?? [];
