import { atariVectorFont, shapeToLines, textToLines, type BeamLine } from '@arcade/vector';
import { LIFE_SHAPE } from './shapes';

/**
 * The texts and icons around the game, at the positions and sizes of the program [P $724F]:
 * coordinates are DVG units, the scale is the one the program sets before drawing.
 */

/** The score of player 1: top left, twice the font size. */
const SCORE = { x: 100, y: 876, scale: 2 };
/** The high score: top center, at the font size. */
const HIGH_SCORE = { x: 480, y: 876, scale: 1 };
/** The first icon of the lives, under the score, at 1/4 like the ship. */
const LIVES = { x: 160, y: 852, scale: 1 / 4 };
/** The copyright line at the bottom edge [R $10A4]. */
const COPYRIGHT = { x: 400, y: 128, scale: 1 };

/** Characters of a score: four digits and a trailing zero, the most the program can count. */
const SCORE_DIGITS = 5;

/**
 * A score as the cabinet writes it. The program keeps tens of points, so the last digit is
 * always a fixed 0; leading zeros are blank, and the digits keep their place on the right.
 * A score of 0 shows as "00".
 */
export const scoreText = (score: number): string =>
  `${String(Math.floor(score / 10))}0`.padStart(SCORE_DIGITS, ' ');

/** One ship icon per life, in a row: each icon ends where the next one begins. */
export const livesLines = (lives: number): readonly BeamLine[] =>
  shapeToLines(Array.from({ length: lives }, () => LIFE_SHAPE).flat(), LIVES);

/** Everything drawn around the game: scores, lives and copyright. */
export const hudLines = (score: number, highScore: number, lives: number): readonly BeamLine[] => [
  ...textToLines(atariVectorFont, scoreText(score), SCORE),
  ...textToLines(atariVectorFont, scoreText(highScore), HIGH_SCORE),
  ...livesLines(lives),
  ...textToLines(atariVectorFont, '© 1979 ATARI INC', COPYRIGHT),
];
