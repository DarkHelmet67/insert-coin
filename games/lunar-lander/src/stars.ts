import type { BeamLine } from '@arcade/vector';
import { toScreen, type Camera } from './camera';
import { MAJOR_HIGH_STARS, MAJOR_STARS, MINOR_STARS, type Star } from './surface-data';

/**
 * The two starfields [R STAR0A-STAR3B, STRM0-STRM15; P STARS]: one for each view, scrolling with
 * the surface. The second field of the whole view, higher up, appears only during a game, when
 * the module climbs and the sky scrolls.
 */

/** A star as a dot. */
const dot = (x: number, y: number, brightness: number): BeamLine => ({
  x1: x,
  y1: y,
  x2: x,
  y2: y,
  brightness,
});

/** Whole-view stars: their coordinates are screen units, repeating every 1024 units. */
const wideStars = (camera: Camera, stars: readonly Star[]): readonly BeamLine[] => {
  const left = toScreen(camera, 0, 0).x;
  return stars.map(([x, y, brightness]) => dot((x + left) % 1024, y - camera.scroll, brightness));
};

/** Close-up stars: world coordinates, like the surface. */
const closeUpStars = (camera: Camera): readonly BeamLine[] =>
  MINOR_STARS.flatMap(([x, y, brightness]) => {
    const screen = toScreen(camera, x, y);
    return screen.x < 1024 ? [dot(screen.x, screen.y, brightness)] : [];
  });

/** The stars to draw with this camera; `playing` adds the high field of the whole view. */
export const starLines = (camera: Camera, playing: boolean): readonly BeamLine[] => {
  if (camera.view === 'minor') return closeUpStars(camera);
  return [
    ...wideStars(camera, MAJOR_STARS),
    ...(playing ? wideStars(camera, MAJOR_HIGH_STARS) : []),
  ];
};
