import type { FilledRect } from '@arcade/voxel';

/** The flat canvas on top of the 3D scene, where the score bars are drawn. */
export type HudContext = Pick<CanvasRenderingContext2D, 'fillStyle' | 'fillRect' | 'clearRect'> & {
  readonly canvas: { readonly width: number; readonly height: number };
};

/**
 * Draws the score bars exactly as the original drew them, on a transparent canvas the size of
 * the original screen: the 3D scene shows through everywhere else.
 */
export const drawHud = (ctx: HudContext, rects: readonly FilledRect[]): void => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  rects.forEach((rect) => {
    ctx.fillStyle = rect.color;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  });
};
