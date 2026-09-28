import {
  arcadeFont,
  drawCenteredText,
  drawSprite,
  drawText,
  type DrawingContext,
  type Sprite,
} from '@arcade/render';
import { alienFrame, isInsertCoinVisible, type AttractState } from './attract';
import { alienColor, type Palette } from './palette';
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

/** Builds the score table rows for the current animation frame, each invader in its row's color. */
const scoreTableRows = (frame: 0 | 1, palette: Palette): readonly ScoreTableRow[] => [
  { sprite: ufoSprite, color: palette.ufo, label: '= ? MYSTERY' },
  { sprite: alienSprites.squid[frame], color: alienColor(palette, 1), label: '= 30 POINTS' },
  { sprite: alienSprites.crab[frame], color: alienColor(palette, 2), label: '= 20 POINTS' },
  { sprite: alienSprites.octopus[frame], color: alienColor(palette, 4), label: '= 10 POINTS' },
];

/** Draws one score table row with its top at `y`. */
const drawScoreTableRow = (
  ctx: DrawingContext,
  { sprite, color, label }: ScoreTableRow,
  y: number,
  textColor: string,
): void => {
  drawSprite(ctx, sprite, SPRITE_CENTER_X - Math.floor(sprite.width / 2), y, color);
  drawText(ctx, arcadeFont, label, LABEL_X, y, textColor);
};

/** Draws the attract screen: title, animated score table, blinking "INSERT COIN" and the keys. */
export const renderAttract = (ctx: DrawingContext, state: AttractState, palette: Palette): void => {
  drawCenteredText(ctx, arcadeFont, 'SPACE INVADERS', 40, palette.text);
  drawCenteredText(ctx, arcadeFont, '*SCORE ADVANCE TABLE*', 80, palette.text);
  scoreTableRows(alienFrame(state), palette).forEach((row, index) => {
    drawScoreTableRow(ctx, row, 104 + index * 20, palette.text);
  });
  if (isInsertCoinVisible(state))
    drawCenteredText(ctx, arcadeFont, 'INSERT COIN', 200, palette.text);
  drawCenteredText(ctx, arcadeFont, '<C> COIN', 220, palette.text);
  drawCenteredText(ctx, arcadeFont, '<V> MONO-COLOR', 234, palette.text);
};
