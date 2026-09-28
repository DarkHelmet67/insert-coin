import { drawSprite, type DrawingContext } from '@arcade/render';
import type { CannonState } from './cannon';
import { colors } from './palette';
import { cannonSprite } from './sprites';

/** Vertical position of the cannon's top edge, in screen pixels. */
const CANNON_Y = 216;

/** Vertical position of the green ground line under the cannon. */
const GROUND_Y = 239;

/** Draws the playfield: for now the ground line and the cannon. */
export const renderPlaying = (ctx: DrawingContext, cannon: CannonState): void => {
  ctx.fillStyle = colors.cannon;
  ctx.fillRect(0, GROUND_Y, ctx.canvas.width, 1);
  drawSprite(ctx, cannonSprite, cannon.x, CANNON_Y, colors.cannon);
};
