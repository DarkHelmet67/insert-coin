/**
 * The visible part of the vector world, and how it maps onto the pixels of a canvas.
 * World coordinates follow the vector hardware (y upwards); canvas pixels go downwards.
 */

/** The window of the world shown on screen: `left`/`bottom` corner, `width` × `height`. */
export interface Viewport {
  readonly left: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
}

/** How world units become canvas pixels: one uniform scale plus the offset of the picture. */
export interface PixelMapping {
  readonly viewport: Viewport;
  /** Pixels per world unit. */
  readonly scale: number;
  /** Pixel position of the viewport's top-left corner (centered when the shapes differ). */
  readonly offsetX: number;
  readonly offsetY: number;
}

/**
 * Fits `viewport` inside a canvas of `pixelWidth` × `pixelHeight`, as large as possible without
 * distortion and centered: a vector monitor has square units, like the screen pixels.
 */
export const fitViewport = (
  viewport: Viewport,
  pixelWidth: number,
  pixelHeight: number,
): PixelMapping => {
  const scale = Math.min(pixelWidth / viewport.width, pixelHeight / viewport.height);
  return {
    viewport,
    scale,
    offsetX: (pixelWidth - viewport.width * scale) / 2,
    offsetY: (pixelHeight - viewport.height * scale) / 2,
  };
};

/** A canvas pixel position. */
export interface Pixel {
  readonly px: number;
  readonly py: number;
}

/** Converts a world point to canvas pixels, turning the y axis upside down. */
export const toPixel = (mapping: PixelMapping, x: number, y: number): Pixel => {
  const { viewport, scale, offsetX, offsetY } = mapping;
  return {
    px: offsetX + (x - viewport.left) * scale,
    py: offsetY + (viewport.bottom + viewport.height - y) * scale,
  };
};
