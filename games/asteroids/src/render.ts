import { clearScreen } from '@arcade/render';
import { drawBeamLines, syncScreen, type BeamLine } from '@arcade/vector';
import type { GameState } from './game';
import { hudLines } from './hud';
import { VIEWPORT } from './playfield';
import { shipLines } from './render-ship';
import { tuning } from './tuning.config';

/** Everything on screen in one frame, as beam lines. Score and lives are fixed for now. */
export const gameLines = (state: GameState): readonly BeamLine[] => [
  ...hudLines(0, 0, 3),
  ...shipLines(state.ship, state.frame),
];

/**
 * Draws one frame: black screen, then the beam lines. The canvas is resized first to the pixels
 * it has on screen, so the lines are sharp at any size.
 */
export const renderGame = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  pixelRatio: number,
): void => {
  const mapping = syncScreen(ctx, VIEWPORT, pixelRatio);
  clearScreen(ctx, '#000');
  drawBeamLines(ctx, gameLines(state), mapping, tuning.beam);
};
