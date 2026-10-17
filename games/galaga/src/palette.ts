import { lookupColors, promColor, type TileColors } from '@arcade/tiles';
import { CHAR_LOOKUP_PROM, PALETTE_PROM, SPRITE_LOOKUP_PROM } from './art/color-proms';

/** The 32 colors of the screen. */
export const SCREEN_COLORS: readonly string[] = PALETTE_PROM.map(promColor);

/**
 * Color 15 (black) is the hardware's "see-through" color: pixels that land on it are not drawn,
 * so the stars and the sprites below stay visible.
 */
const SEE_THROUGH = 0x0f;

/** Sprite palette `index` (0-15): the 4 colors of a sprite come from screen colors 0-15. */
export const spriteColors = (index: number): TileColors =>
  lookupColors(
    { prom: SPRITE_LOOKUP_PROM, colors: SCREEN_COLORS, transparent: SEE_THROUGH },
    index,
  );

/** Character palette `index` (0-31): characters use screen colors 16-31. */
export const charColors = (index: number): TileColors =>
  lookupColors(
    { prom: CHAR_LOOKUP_PROM, colors: SCREEN_COLORS.slice(16), transparent: SEE_THROUGH },
    index,
  );
