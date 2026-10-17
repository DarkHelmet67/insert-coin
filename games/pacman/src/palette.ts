import { lookupColors, promColor, type TileColors } from '@arcade/tiles';
import { LOOKUP_PROM, PALETTE_PROM } from './art/color-proms';

/** The 16 colors of the screen. */
const SCREEN_COLORS: readonly string[] = PALETTE_PROM.slice(0, 16).map(promColor);

/**
 * The three colors of palette `index` (0-63), for characters and sprites alike. Pixels on
 * color 0 (black) are left undrawn, so a sprite never hides what is behind its black parts.
 */
export const paletteColors = (index: number): TileColors =>
  lookupColors({ prom: LOOKUP_PROM, colors: SCREEN_COLORS, transparent: 0 }, index & 0x3f);
