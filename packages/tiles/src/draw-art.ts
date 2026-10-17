import { drawSprite, type DrawingContext } from '@arcade/render';
import type { TileColors } from './colors';
import type { PixelArt } from './pixel-art';

/** Draws a tile with its top-left corner at (`x`, `y`), one layer per color. */
export const drawArt = (
  ctx: DrawingContext,
  art: PixelArt,
  x: number,
  y: number,
  colors: TileColors,
): void => {
  art.layers.forEach((layer, index) => {
    const color = colors[index];
    if (color !== undefined) drawSprite(ctx, layer, x, y, color);
  });
};
