import { clearScreen } from '@arcade/render';
import { drawBeamLines, syncScreen, type BeamLine } from '@arcade/vector';
import { VIEWPORT } from './playfield';
import { tuning } from './tuning.config';

/**
 * Draws one frame: black screen, then the beam lines. The canvas is resized first to the pixels
 * it has on screen, so the lines are sharp at any size.
 */
export const renderLines = (
  ctx: CanvasRenderingContext2D,
  lines: readonly BeamLine[],
  pixelRatio: number,
): void => {
  const mapping = syncScreen(ctx, VIEWPORT, pixelRatio);
  clearScreen(ctx, '#000');
  drawBeamLines(ctx, lines, mapping, tuning.beam);
};
