import { chars00 } from './art/chars-00';
import { chars20 } from './art/chars-20';
import { chars40 } from './art/chars-40';
import { chars60 } from './art/chars-60';
import { sprites00 } from './art/sprites-00';
import { sprites08 } from './art/sprites-08';
import { sprites10 } from './art/sprites-10';
import { sprites18 } from './art/sprites-18';
import { sprites20 } from './art/sprites-20';
import { sprites28 } from './art/sprites-28';
import { sprites30 } from './art/sprites-30';
import { sprites38 } from './art/sprites-38';
import { sprites40 } from './art/sprites-40';
import { sprites48 } from './art/sprites-48';
import { sprites50 } from './art/sprites-50';
import { sprites58 } from './art/sprites-58';
import { sprites60 } from './art/sprites-60';
import { sprites68 } from './art/sprites-68';
import { sprites70 } from './art/sprites-70';
import { sprites78 } from './art/sprites-78';
import { flipArt, joinArt, parseArt, type ArtRows, type Flip, type PixelArt } from './pixel-art';

/** The 128 sprites of the ROMs, indexed by their code. */
const SPRITE_ROWS: readonly ArtRows[] = [
  ...sprites00,
  ...sprites08,
  ...sprites10,
  ...sprites18,
  ...sprites20,
  ...sprites28,
  ...sprites30,
  ...sprites38,
  ...sprites40,
  ...sprites48,
  ...sprites50,
  ...sprites58,
  ...sprites60,
  ...sprites68,
  ...sprites70,
  ...sprites78,
];

/** The 128 characters of the ROM, indexed by their code. */
const CHAR_ROWS: readonly ArtRows[] = [...chars00, ...chars20, ...chars40, ...chars60];

/** An empty tile, for codes outside the ROM. */
const BLANK: ArtRows = Array.from({ length: 16 }, () => '.'.repeat(16));

/** The four ways the hardware can mirror a tile, in the order of `flipIndex`. */
const FLIPS: readonly Flip[] = [
  { x: false, y: false },
  { x: true, y: false },
  { x: false, y: true },
  { x: true, y: true },
];

/** Position of a mirroring in `FLIPS`. */
const flipIndex = (flip: Flip): number => (flip.x ? 1 : 0) + (flip.y ? 2 : 0);

/** Every tile parsed once in its four mirrorings, so drawing never parses art again. */
const allFlips = (rows: ArtRows): readonly PixelArt[] =>
  FLIPS.map((flip) => parseArt(flipArt(rows, flip)));

const SPRITES = SPRITE_ROWS.map(allFlips);
const CHARS = CHAR_ROWS.map(allFlips);

/** Sprite `code` (0-127), mirrored as `flip` says. */
export const spriteArt = (code: number, flip: Flip): PixelArt =>
  (SPRITES[code] ?? allFlips(BLANK))[flipIndex(flip)] ?? parseArt(BLANK);

/** Character `code` (0-127), as stored. */
export const charArt = (code: number): PixelArt =>
  (CHARS[code] ?? allFlips(BLANK))[0] ?? parseArt(BLANK);

/**
 * The art of a "double size" sprite: four tiles in a square, 32×32 pixels. On the vertical
 * monitor tile `code` sits top right, `code + 1` bottom right, `code + 2` top left and `code + 3`
 * bottom left: the hardware lays them out along the monitor's own axes, and the cabinet turns it.
 */
const bigRows = (code: number): ArtRows => {
  /** The tile `offset` codes after `code`. */
  const tile = (offset: number): ArtRows => SPRITE_ROWS[code + offset] ?? BLANK;
  return joinArt(tile(2), tile(0), tile(3), tile(1));
};

/** Double size sprites start on codes that are multiples of 4: 32 of them. */
const BIG_SPRITES = Array.from({ length: 32 }, (_, group) => allFlips(bigRows(group * 4)));

/** The double size sprite made of codes `code` to `code + 3` (`code` a multiple of 4). */
export const bigSpriteArt = (code: number, flip: Flip): PixelArt =>
  (BIG_SPRITES[code >> 2] ?? allFlips(BLANK))[flipIndex(flip)] ?? parseArt(BLANK);
