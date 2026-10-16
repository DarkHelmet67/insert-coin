/**
 * Brightness added by each bit of a red or green channel. Namco's color PROM drives three
 * resistors (1 kΩ, 470 Ω, 220 Ω) for red and green, two (470 Ω, 220 Ω) for blue: these are the
 * weights MAME computes from those resistors, the same on Pac-Man and Galaga.
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

/**
 * The three colors of a tile's pixel values 1, 2 and 3; `undefined` means transparent.
 * Pixel value 0 is always transparent, so it has no entry.
 */
export type TileColors = readonly [string | undefined, string | undefined, string | undefined];

/** How to read a lookup PROM: which colors its entries point into, and which entry is see-through. */
export interface LookupTable {
  /** The PROM bytes, 4 per palette (one per pixel value). */
  readonly prom: readonly number[];
  /** The colors the low 4 bits of an entry point into. */
  readonly colors: readonly string[];
  /** The entry whose pixels are not drawn, so what lies below stays visible. */
  readonly transparent: number;
}

/** The colors of palette `index` of a lookup PROM. */
export const lookupColors = (table: LookupTable, index: number): TileColors => {
  /** The color of pixel value `value`, or `undefined` when it lands on the transparent entry. */
  const color = (value: number): string | undefined => {
    const entry = (table.prom[index * 4 + value] ?? 0) & 0x0f;
    return entry === table.transparent ? undefined : table.colors[entry];
  };
  return [color(1), color(2), color(3)];
};
