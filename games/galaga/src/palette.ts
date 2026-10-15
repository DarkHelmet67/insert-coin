import { CHAR_LOOKUP_PROM, PALETTE_PROM, SPRITE_LOOKUP_PROM } from './art/color-proms';

/**
 * Brightness added by each bit of a red or green channel. The PROM drives three resistors
 * (1 kΩ, 470 Ω, 220 Ω) for red and green, two (470 Ω, 220 Ω) for blue: these are the weights
 * MAME computes from those resistors.
 */
const RED_GREEN_WEIGHTS = [0x21, 0x47, 0x97] as const;
const BLUE_WEIGHTS = [0x51, 0xae] as const;

/** Sum of the weights whose bit is set in `bits`. */
const channel = (bits: number, weights: readonly number[]): number =>
  weights.reduce((sum, weight, bit) => sum + ((bits >> bit) & 1) * weight, 0);

/** Two hex digits of a channel value. */
const hex2 = (value: number): string => value.toString(16).padStart(2, '0');

/** The CSS color of one PROM byte, laid out as BBGGGRRR. */
export const promColor = (byte: number): string =>
  `#${hex2(channel(byte & 7, RED_GREEN_WEIGHTS))}${hex2(channel((byte >> 3) & 7, RED_GREEN_WEIGHTS))}${hex2(channel(byte >> 6, BLUE_WEIGHTS))}`;

/** The 32 colors of the screen. */
export const SCREEN_COLORS: readonly string[] = PALETTE_PROM.map(promColor);

/**
 * The three colors of a tile's pixel values 1, 2 and 3; `undefined` means transparent.
 * Color 15 (black) is the hardware's "see-through" color: pixels that land on it are not drawn,
 * so the stars and the sprites below stay visible.
 */
export type TileColors = readonly [string | undefined, string | undefined, string | undefined];

/** The colors of palette `index` in a lookup PROM, whose entries point into `colors`. */
const lookupColors = (
  prom: readonly number[],
  index: number,
  colors: readonly string[],
): TileColors => {
  /** The color of pixel value `value`, or `undefined` when it lands on color 15. */
  const color = (value: number): string | undefined => {
    const entry = (prom[index * 4 + value] ?? 0) & 0x0f;
    return entry === 0x0f ? undefined : colors[entry];
  };
  return [color(1), color(2), color(3)];
};

/** Sprite palette `index` (0-15): the 4 colors of a sprite come from screen colors 0-15. */
export const spriteColors = (index: number): TileColors =>
  lookupColors(SPRITE_LOOKUP_PROM, index, SCREEN_COLORS);

/** Character palette `index` (0-31): characters use screen colors 16-31. */
export const charColors = (index: number): TileColors =>
  lookupColors(CHAR_LOOKUP_PROM, index, SCREEN_COLORS.slice(16));
