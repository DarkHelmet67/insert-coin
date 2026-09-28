import { intersection, type Rect } from './rect';

/**
 * A monochrome image: the only shape information the collision code needs.
 * `Sprite` from `@arcade/render` matches this interface, so sprites can be passed directly
 * without this package depending on the rendering one.
 */
export interface Bitmap {
  readonly width: number;
  readonly height: number;
  /** Row-major pixels: `pixels[y * width + x]` is true when the pixel is solid. */
  readonly pixels: readonly boolean[];
}

/** A bitmap placed on the screen. Coordinates are rounded to whole pixels, exactly like drawing. */
export interface PlacedBitmap {
  readonly bitmap: Bitmap;
  readonly x: number;
  readonly y: number;
}

/** The screen rectangle covered by a placed bitmap. */
export const boundsOf = ({ bitmap, x, y }: PlacedBitmap): Rect => ({
  x: Math.round(x),
  y: Math.round(y),
  width: bitmap.width,
  height: bitmap.height,
});

/** Whether the placed bitmap has a solid pixel at the screen position (`screenX`, `screenY`). */
export const isSolidAt = (placed: PlacedBitmap, screenX: number, screenY: number): boolean => {
  const { x, y, width } = boundsOf(placed);
  return placed.bitmap.pixels[(screenY - y) * width + (screenX - x)] === true;
};

/** Lists every screen pixel inside `rect`. */
const pixelsIn = (rect: Rect): readonly (readonly [number, number])[] =>
  Array.from({ length: rect.width * rect.height }, (_, i) => [
    rect.x + (i % rect.width),
    rect.y + Math.floor(i / rect.width),
  ]);

/**
 * Pixel-perfect collision: whether two placed bitmaps have a solid pixel in the same place.
 * First the cheap rectangle test; only when the rectangles overlap are the pixels of the
 * shared area compared one by one.
 */
export const bitmapsOverlap = (a: PlacedBitmap, b: PlacedBitmap): boolean => {
  const shared = intersection(boundsOf(a), boundsOf(b));
  return (
    shared !== undefined &&
    pixelsIn(shared).some(([x, y]) => isSolidAt(a, x, y) && isSolidAt(b, x, y))
  );
};
