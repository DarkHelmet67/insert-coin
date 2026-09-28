import { colorConfig } from './colors.config';

/** How the screen is colored: like the black and white monitor, or with the colored film. */
export type ColorMode = 'mono' | 'color';

/** The colors used to draw one frame, already resolved for the current color mode. */
export interface Palette {
  readonly background: string;
  readonly text: string;
  readonly cannon: string;
  readonly ufo: string;
  readonly shots: string;
  /** Invader colors, one per formation row from top to bottom. */
  readonly alienRows: readonly string[];
}

/** The colors from the configuration file. */
const colorPalette: Palette = colorConfig;

/** Every object in the monitor's single color. */
const monoPalette: Palette = {
  background: colorConfig.background,
  text: colorConfig.mono,
  cannon: colorConfig.mono,
  ufo: colorConfig.mono,
  shots: colorConfig.mono,
  alienRows: colorConfig.alienRows.map(() => colorConfig.mono),
};

/** The palette for `mode`. */
export const paletteFor = (mode: ColorMode): Palette =>
  mode === 'mono' ? monoPalette : colorPalette;

/** The other color mode: what the V key switches to. */
export const toggleColorMode = (mode: ColorMode): ColorMode => (mode === 'mono' ? 'color' : 'mono');

/** The color of an invader in formation row `row` (1 = top); the last color covers extra rows. */
export const alienColor = (palette: Palette, row: number): string =>
  palette.alienRows[Math.min(row, palette.alienRows.length) - 1] ?? palette.text;
