import { arcadeFont, clearScreen, drawText, textWidth } from '@arcade/render';
import { SCREEN_WIDTH } from './playfield';

/** Color of the beam on the black and white vector monitor. */
const BEAM = '#fff';

/** The pixel font is 8 pixels tall: scaled 4 times it reads well on the 1024-unit screen. */
const TEXT_SCALE = 4;

/**
 * Rock pattern 1 of the vector ROM (address $11E6): the outline as steps from one corner to
 * the next, x to the right and y upwards as in the DVG. It is the first shape of the game,
 * drawn here as a preview; the vector engine of step 2 will draw all of them.
 */
const ROCK_OUTLINE: readonly (readonly [number, number])[] = [
  [16, 16],
  [16, -16],
  [-8, -16],
  [8, -16],
  [-24, -16],
  [-24, 0],
  [-16, 16],
  [0, 32],
  [16, 16],
  [16, -16],
];

/** Draws the rock outline starting at (`x`, `y`) on the canvas, `scale` times its ROM size. */
const drawRock = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void => {
  ctx.strokeStyle = BEAM;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ROCK_OUTLINE.reduce(
    ([fromX, fromY], [dx, dy]) => {
      // The DVG y grows upwards, the canvas y downwards.
      const next = [fromX + dx * scale, fromY - dy * scale] as const;
      ctx.lineTo(next[0], next[1]);
      return next;
    },
    [x, y] as const,
  );
  ctx.stroke();
};

/** Writes `text` centered on the screen with the pixel font, scaled up. */
const drawBigText = (ctx: CanvasRenderingContext2D, text: string, y: number): void => {
  const x = (SCREEN_WIDTH - textWidth(arcadeFont, text) * TEXT_SCALE) / 2;
  ctx.save();
  ctx.scale(TEXT_SCALE, TEXT_SCALE);
  drawText(ctx, arcadeFont, text, x / TEXT_SCALE, y / TEXT_SCALE, BEAM);
  ctx.restore();
};

/** Placeholder screen shown while the game is being built. */
export const renderPlaceholder = (ctx: CanvasRenderingContext2D): void => {
  clearScreen(ctx, '#000');
  drawRock(ctx, SCREEN_WIDTH / 2, 180, 3);
  drawBigText(ctx, 'ASTEROIDS', 440);
  drawBigText(ctx, 'COMING SOON', 520);
};
