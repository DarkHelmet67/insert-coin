import type { DrawingContext } from '@arcade/render';
import type { StarField } from './playing';
import { visibleStars } from './stars';

/** Draws the stars of a frame, one pixel each. */
export const drawStars = (ctx: DrawingContext, stars: StarField, frame: number): void => {
  visibleStars(stars.phase, stars.speed, frame).forEach((star) => {
    ctx.fillStyle = star.color;
    ctx.fillRect(star.x, star.y, 1, 1);
  });
};
