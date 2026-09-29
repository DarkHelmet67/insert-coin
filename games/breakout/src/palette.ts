import { colorConfig } from './colors.config';
import { BRICK_HEIGHT, BRICKS_TOP } from './playfield';
import { tuning } from './tuning.config';

/** How the screen is colored: like the black and white monitor, or with the colored film. */
export type ColorMode = 'mono' | 'color';

/** A horizontal band of colored film on the screen. */
export interface FilmStrip {
  readonly top: number;
  readonly height: number;
  readonly color: string;
}

/** The colors of one frame, already resolved for the current color mode. */
export interface Palette {
  readonly background: string;
  /** The monitor's color: everything is drawn with it, then the strips tint it. */
  readonly ink: string;
  readonly strips: readonly FilmStrip[];
}

/** Height of a brick strip: each one covers two rows of bricks. */
const BRICK_STRIP_HEIGHT = 2 * BRICK_HEIGHT;

/** The film on the glass: four strips over the bricks and one over the paddle. */
const filmStrips: readonly FilmStrip[] = [
  ...colorConfig.brickStrips.map((color, index) => ({
    top: BRICKS_TOP + index * BRICK_STRIP_HEIGHT,
    height: BRICK_STRIP_HEIGHT,
    color,
  })),
  { ...tuning.paddleStrip, color: colorConfig.paddleStrip },
];

/** The palette for `mode`: in mono there is no film on the glass. */
export const paletteFor = (mode: ColorMode): Palette => ({
  background: colorConfig.background,
  ink: colorConfig.mono,
  strips: mode === 'color' ? filmStrips : [],
});

/** The other color mode: what the V key switches to. */
export const toggleColorMode = (mode: ColorMode): ColorMode => (mode === 'mono' ? 'color' : 'mono');
