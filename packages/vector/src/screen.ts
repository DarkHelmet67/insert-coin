import { fitViewport, type PixelMapping, type Viewport } from './viewport';

/** The part of the canvas context the screen needs: its canvas, to resize it. */
export interface ScreenContext {
  readonly canvas: {
    width: number;
    height: number;
    readonly clientWidth: number;
    readonly clientHeight: number;
  };
}

/**
 * Gives the canvas as many pixels as it has on screen (CSS size × device pixel ratio), so lines
 * are sharp on any display, Retina included. Call it before drawing each frame: it only touches
 * the canvas when the size has changed, because resizing a canvas clears it.
 * @returns the mapping from world units to the pixels of the canvas.
 */
export const syncScreen = (
  ctx: ScreenContext,
  viewport: Viewport,
  pixelRatio: number,
): PixelMapping => {
  const width = Math.round(ctx.canvas.clientWidth * pixelRatio);
  const height = Math.round(ctx.canvas.clientHeight * pixelRatio);
  if (width > 0 && height > 0 && (ctx.canvas.width !== width || ctx.canvas.height !== height)) {
    ctx.canvas.width = width;
    ctx.canvas.height = height;
  }
  return fitViewport(viewport, ctx.canvas.width, ctx.canvas.height);
};
