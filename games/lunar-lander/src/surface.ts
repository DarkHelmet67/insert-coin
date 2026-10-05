import type { BeamLine } from '@arcade/vector';
import { SURFACE, type Point } from './surface-data';

/**
 * The lunar surface: its height under any point, and its lines on the screen [R LUNMIN;
 * P SCAPE, DECODE]. See docs/meccaniche-originali.md, section 2.
 */

/** Width of the world: the surface repeats every 4096 units [R MINTBL]. */
export const WORLD_WIDTH = 4096;

/** Brightness of the surface [R SEG001-SEG025]. */
export const SURFACE_BRIGHTNESS = 10;

/** `x` brought into the world, 0 to 4095. */
export const wrapX = (x: number): number => ((x % WORLD_WIDTH) + WORLD_WIDTH) % WORLD_WIDTH;

/** The segment of the surface whose x range holds `x` (0 to 4095); cliffs have no width. */
const segmentAt = (x: number): readonly [Point, Point] => {
  const index = SURFACE.findIndex(([px], i) => i > 0 && px > x);
  const end = SURFACE[index] ?? SURFACE[SURFACE.length - 1] ?? [WORLD_WIDTH, 0];
  const start = SURFACE[index - 1] ?? SURFACE[0] ?? [0, 0];
  return [start, end];
};

/**
 * Height of the surface under `x`, in world units. At the foot of a cliff the height is the one
 * on its right, as when the program walks the vectors from left to right [P DECODE].
 */
export const surfaceHeight = (x: number): number => {
  const [[x1, y1], [x2, y2]] = segmentAt(wrapX(x));
  return x2 === x1 ? y2 : y1 + ((y2 - y1) * (wrapX(x) - x1)) / (x2 - x1);
};

/** How the surface is placed on the screen: scale, then offsets, as the camera computes them. */
export interface SurfaceProjection {
  /** World units per screen unit: 4 in the whole-surface view, 1 in the close-up. */
  readonly zoom: number;
  /** Screen x of world x = 0 (any copy: the surface repeats). */
  readonly left: number;
  /** Screen y of world y = 0. */
  readonly bottom: number;
}

/** The whole surface once, starting at screen x `left`. */
const surfaceCopy = (projection: SurfaceProjection, left: number): readonly BeamLine[] =>
  SURFACE.slice(1).map(([x2, y2], i) => {
    const [x1, y1] = SURFACE[i] ?? [0, 0];
    const { zoom, bottom } = projection;
    return {
      x1: left + x1 / zoom,
      y1: bottom + y1 / zoom,
      x2: left + x2 / zoom,
      y2: bottom + y2 / zoom,
      brightness: SURFACE_BRIGHTNESS,
    };
  });

/**
 * The lines of the surface that can reach the screen, before clipping: the copies of the
 * repeating surface that overlap the 1024 units of the screen.
 */
export const surfaceLines = (projection: SurfaceProjection): readonly BeamLine[] => {
  const width = WORLD_WIDTH / projection.zoom;
  const first = projection.left - Math.ceil(projection.left / width) * width;
  const copies = Math.ceil((1024 - first) / width);
  return Array.from({ length: copies }, (_, i) => first + i * width)
    .filter((left) => left < 1024 && left + width > 0)
    .flatMap((left) =>
      surfaceCopy(projection, left).filter(
        (line) => Math.max(line.x1, line.x2) >= 0 && Math.min(line.x1, line.x2) < 1024,
      ),
    );
};
