/** An axis-aligned rectangle in screen pixels: (`x`, `y`) is the top-left corner. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Whether two rectangles overlap (AABB test: "axis-aligned bounding boxes").
 * They overlap unless one is completely to the left, right, above or below the other.
 * Rectangles that only touch along an edge do not overlap.
 */
export const rectsOverlap = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/** The area shared by two rectangles, or `undefined` when they do not overlap. */
export const intersection = (a: Rect, b: Rect): Rect | undefined => {
  if (!rectsOverlap(a, b)) return undefined;
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  return {
    x,
    y,
    width: Math.min(a.x + a.width, b.x + b.width) - x,
    height: Math.min(a.y + a.height, b.y + b.height) - y,
  };
};
