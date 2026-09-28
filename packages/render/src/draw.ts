import { spriteRuns, type Sprite } from './sprite';

/**
 * The only canvas features the drawing helpers use.
 * Declaring them explicitly lets tests pass a small fake instead of a real canvas.
 */
export type DrawingContext = Pick<CanvasRenderingContext2D, 'fillStyle' | 'fillRect'> & {
  readonly canvas: { readonly width: number; readonly height: number };
};

/** Fills the whole screen with one color (black by default, like a switched-off CRT). */
export const clearScreen = (ctx: DrawingContext, color = '#000'): void => {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

/** Draws `sprite` with its top-left corner at (`x`, `y`), rounded to whole pixels to stay crisp. */
export const drawSprite = (
  ctx: DrawingContext,
  sprite: Sprite,
  x: number,
  y: number,
  color: string,
): void => {
  const left = Math.round(x);
  const top = Math.round(y);
  ctx.fillStyle = color;
  spriteRuns(sprite).forEach((run) => {
    ctx.fillRect(left + run.x, top + run.y, run.length, 1);
  });
};
