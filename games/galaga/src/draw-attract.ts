import type { DrawingContext } from '@arcade/render';
import type { Attract } from './attract';
import { drawObjects } from './draw-objects';
import { drawStars } from './draw-stars';
import { drawMessages } from './draw-texts';

/** Draws the attract screen: stars, the aliens of the score table, the texts. */
export const drawAttract = (ctx: DrawingContext, attract: Attract): void => {
  drawStars(ctx, attract.stars, attract.frame);
  drawObjects(ctx, attract.objects);
  drawMessages(ctx, attract.messages);
};
