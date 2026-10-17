import type { DrawingContext } from '@arcade/render';
import { drawArt } from '@arcade/tiles';
import { paletteColors } from './palette';
import { spriteScreenPosition, type HardwareSprite } from './sprites';
import { spriteArt } from './tile-art';

/**
 * Draws the hardware sprites. The hardware gives the lowest sprite number priority, so they
 * are drawn from the last to the first: the first ends up on top.
 */
export const drawSprites = (ctx: DrawingContext, sprites: readonly HardwareSprite[]): void => {
  [...sprites].reverse().forEach((sprite) => {
    if (sprite.palette === 0) return;
    const { x, y } = spriteScreenPosition(sprite);
    drawArt(ctx, spriteArt(sprite.code, sprite.flip), x, y, paletteColors(sprite.palette));
  });
};
