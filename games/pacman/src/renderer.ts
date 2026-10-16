import { clearScreen } from '@arcade/render';
import { actorSprites } from './actors';
import { drawSprites } from './draw-sprites';
import { drawVideo } from './draw-video';
import type { GameState } from './game';
import type { Video } from './video';

/**
 * Draws the game like the hardware: the tiles of the video RAM, then the sprites on top. The
 * tiles go on a layer of their own that keeps the last picture, so each frame redraws only
 * the cells that changed (`previous` is the video already on the layer, private to this
 * closure).
 */
export const createRenderer = (
  ctx: CanvasRenderingContext2D,
  layer: CanvasRenderingContext2D,
): ((state: GameState) => void) => {
  let previous: Video | undefined;
  return (state) => {
    const { video } = state.playing;
    drawVideo(layer, video, previous);
    previous = video;
    clearScreen(ctx);
    ctx.drawImage(layer.canvas, 0, 0);
    drawSprites(ctx, actorSprites(state.stage, state.playing));
  };
};
