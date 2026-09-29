import type { DrawingContext } from '@arcade/render';
import type { FilmStrip } from './palette';

/** A canvas context that can also blend colors, as the film strips need. */
export type FilmContext = DrawingContext &
  Pick<CanvasRenderingContext2D, 'globalCompositeOperation'>;

/**
 * Lays the colored film on the screen, like the strips glued on the cabinet's glass.
 * With the `multiply` blend a white pixel takes the strip's color and a black one stays black:
 * the same thing the film did to the light of the monitor.
 */
export const renderFilm = (ctx: FilmContext, strips: readonly FilmStrip[]): void => {
  ctx.globalCompositeOperation = 'multiply';
  strips.forEach(({ top, height, color }) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, top, ctx.canvas.width, height);
  });
  ctx.globalCompositeOperation = 'source-over';
};
