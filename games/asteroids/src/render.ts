import { clearScreen } from '@arcade/render';
import { drawBeamLines, syncScreen, type BeamLine } from '@arcade/vector';
import type { GameState } from './game';
import { hudLines } from './hud';
import { VIEWPORT } from './playfield';
import { rocksLines, shotsLines } from './render-rocks';
import { messageLines } from './messages';
import { saucerLines } from './render-saucer';
import { playerLines } from './render-ship';
import { tuning } from './tuning.config';

/** Everything on screen in one frame, as beam lines. */
export const gameLines = (state: GameState): readonly BeamLine[] => [
  ...hudLines(state.score, state.hiScore, state.lives),
  ...messageLines(state),
  ...rocksLines(state.rocks),
  ...saucerLines(state.saucer),
  ...shotsLines(state.shots),
  ...shotsLines(state.saucerShots),
  ...playerLines(state.ship, state.life, state.frame),
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
