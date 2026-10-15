import type { DrawingContext } from '@arcade/render';
import { drawCellText } from './text';

/** Character palettes of the texts, as the program sets them before each string. */
export const TEXT_COLOR = {
  /** Light blue: most messages. */
  blue: 0,
  /** White: the copyright line. */
  white: 3,
  /** Red: "1UP", "HIGH SCORE", "FIGHTER CAPTURED". */
  red: 4,
  /** Yellow: bonuses and results. */
  yellow: 5,
} as const;

/** A score as the cabinet writes it: right-aligned, at least "00", up to 6 digits. */
export const scoreText = (score: number): string =>
  String(score % 1_000_000)
    .padStart(2, '0')
    .padStart(6, ' ');

/**
 * The two top lines: "1UP" (blinking during play) and the score on the left, the best score in
 * the middle (`c_093C`, `c_textout_1uphighscore_onetime`).
 */
export const drawScores = (
  ctx: DrawingContext,
  score: number,
  hiScore: number,
  blinkOff: boolean,
): void => {
  if (!blinkOff) drawCellText(ctx, '1UP', 2, 0, TEXT_COLOR.red);
  drawCellText(ctx, 'HIGH SCORE', 9, 0, TEXT_COLOR.red);
  drawCellText(ctx, scoreText(score), 0, 1, TEXT_COLOR.white);
  drawCellText(ctx, scoreText(hiScore), 11, 1, TEXT_COLOR.white);
};
