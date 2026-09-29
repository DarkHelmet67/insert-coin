import { drawSegmentNumber, type DrawingContext } from '@arcade/render';
import { tuning } from './tuning.config';

/** The score as the three digits of the original counter: 7 becomes "007". */
export const formatScore = (score: number): string => String(score % 1000).padStart(3, '0');

/**
 * Draws the numbers above the bricks, as on the cabinet: player up and player 1's score on the
 * left, ball number and player 2's score on the right, in seven-segment digits.
 */
export const renderHud = (
  ctx: DrawingContext,
  { player, score, ball, otherScore }: HudValues,
  color: string,
): void => {
  const { pitch, leftGroupX, rightGroupX, upperRowY, lowerRowY } = tuning.digits;
  drawSegmentNumber(ctx, String(player), leftGroupX, upperRowY, pitch, tuning.digits, color);
  drawSegmentNumber(ctx, formatScore(score), leftGroupX, lowerRowY, pitch, tuning.digits, color);
  drawSegmentNumber(ctx, String(ball), rightGroupX, upperRowY, pitch, tuning.digits, color);
  drawSegmentNumber(
    ctx,
    formatScore(otherScore),
    rightGroupX,
    lowerRowY,
    pitch,
    tuning.digits,
    color,
  );
};

/** The numbers shown at the top of the screen. */
export interface HudValues {
  /** The player up: 1 or 2. */
  readonly player: number;
  readonly score: number;
  /** Number of the ball in play. */
  readonly ball: number;
  /** The other player's score, always shown by the original. */
  readonly otherScore: number;
}
