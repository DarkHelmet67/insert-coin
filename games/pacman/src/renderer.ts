import { clearScreen } from '@arcade/render';
import { NO_FLIP } from '@arcade/tiles';
import { drawSprites } from './draw-sprites';
import { drawVideo } from './draw-video';
import type { GameState } from './game';
import { pacmanSprite } from './pacman-sprite';
import type { HardwareSprite } from './sprites';
import type { Video } from './video';

/** The ghosts in their start places, until they move. */
const GHOSTS_AT_HOME: readonly HardwareSprite[] = [
  { code: 0x20, palette: 1, flip: NO_FLIP, x: 0x80, y: 0x64 },
  { code: 0x20, palette: 3, flip: NO_FLIP, x: 0x80, y: 0x7c },
  { code: 0x20, palette: 5, flip: NO_FLIP, x: 0x90, y: 0x7c },
  { code: 0x20, palette: 7, flip: NO_FLIP, x: 0x70, y: 0x7c },
];

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
    const { video, pacman } = state.playing;
    drawVideo(layer, video, previous);
    previous = video;
    clearScreen(ctx);
    ctx.drawImage(layer.canvas, 0, 0);
    drawSprites(ctx, [...GHOSTS_AT_HOME, pacmanSprite(pacman)]);
  };
};
