import {
  arcadeFont,
  drawCenteredText,
  drawSprite,
  drawText,
  type DrawingContext,
  type Sprite,
} from '@arcade/render';
import { alienFrame, isInsertCoinVisible, type AttractState } from './attract';
import { colors } from './palette';
import { alienSprites, ufoSprite } from './sprites';

/** One line of the score table: a sprite, its color and the points it is worth. */
interface ScoreTableRow {
  readonly sprite: Sprite;
  readonly color: string;
  readonly label: string;
}

/** Horizontal center of the sprite column and left edge of the text column. */
const SPRITE_CENTER_X = 72;
const LABEL_X = 88;

/** Builds the score table rows for the current animation frame. */
const scoreTableRows = (frame: 0 | 1): readonly ScoreTableRow[] => [
  { sprite: ufoSprite, color: colors.ufo, label: '= ? MYSTERY' },
  { sprite: alienSprites.squid[frame], color: colors.aliens, label: '= 30 POINTS' },
  { sprite: alienSprites.crab[frame], color: colors.aliens, label: '= 20 POINTS' },
  { sprite: alienSprites.octopus[frame], color: colors.aliens, label: '= 10 POINTS' },
];

/** Draws one score table row with its top at `y`. */
const drawScoreTableRow = (
  ctx: DrawingContext,
  { sprite, color, label }: ScoreTableRow,
  y: number,
): void => {
  drawSprite(ctx, sprite, SPRITE_CENTER_X - Math.floor(sprite.width / 2), y, color);
  drawText(ctx, arcadeFont, label, LABEL_X, y, colors.text);
};

/** Draws the attract screen: title, animated score table and blinking "INSERT COIN". */
export const renderAttract = (ctx: DrawingContext, state: AttractState): void => {
  drawCenteredText(ctx, arcadeFont, 'SPACE INVADERS', 40, colors.text);
  drawCenteredText(ctx, arcadeFont, '*SCORE ADVANCE TABLE*', 80, colors.text);
  scoreTableRows(alienFrame(state)).forEach((row, index) => {
    drawScoreTableRow(ctx, row, 104 + index * 20);
  });
  if (isInsertCoinVisible(state))
    drawCenteredText(ctx, arcadeFont, 'INSERT COIN', 200, colors.text);
  drawCenteredText(ctx, arcadeFont, '<C> COIN', 224, colors.text);
};
