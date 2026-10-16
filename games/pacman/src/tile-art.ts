import { flipArt, parseArt, type ArtRows, type Flip, type PixelArt } from '@arcade/tiles';
import { chars00 } from './art/chars-00';
import { chars20 } from './art/chars-20';
import { chars40 } from './art/chars-40';
import { chars60 } from './art/chars-60';
import { chars80 } from './art/chars-80';
import { charsA0 } from './art/chars-a0';
import { charsC0 } from './art/chars-c0';
import { charsE0 } from './art/chars-e0';
import { sprites00 } from './art/sprites-00';
import { sprites08 } from './art/sprites-08';
import { sprites10 } from './art/sprites-10';
import { sprites18 } from './art/sprites-18';
import { sprites20 } from './art/sprites-20';
import { sprites28 } from './art/sprites-28';
import { sprites30 } from './art/sprites-30';
import { sprites38 } from './art/sprites-38';

/** The 256 characters of ROM 5e: maze, dots, letters, digits. */
const CHAR_ROWS: readonly ArtRows[] = [
  ...chars00,
  ...chars20,
  ...chars40,
  ...chars60,
  ...chars80,
  ...charsA0,
  ...charsC0,
  ...charsE0,
];

/** The 64 sprites of ROM 5f. */
const SPRITE_ROWS: readonly ArtRows[] = [
  ...sprites00,
  ...sprites08,
  ...sprites10,
  ...sprites18,
  ...sprites20,
  ...sprites28,
  ...sprites30,
  ...sprites38,
];

/** An empty sprite, for codes outside the ROM. */
const BLANK = parseArt(Array.from({ length: 16 }, () => '.'.repeat(16)));

/** The four ways the hardware can mirror a sprite, in the order of `flipIndex`. */
const FLIPS: readonly Flip[] = [
  { x: false, y: false },
  { x: true, y: false },
  { x: false, y: true },
  { x: true, y: true },
];

/** Position of a mirroring in `FLIPS`. */
const flipIndex = (flip: Flip): number => (flip.x ? 1 : 0) + (flip.y ? 2 : 0);

/** Every character parsed once, so drawing never parses art again. */
const CHARS = CHAR_ROWS.map(parseArt);

/** Every sprite parsed once in its four mirrorings. */
const SPRITES = SPRITE_ROWS.map((rows) => FLIPS.map((flip) => parseArt(flipArt(rows, flip))));

/** The character with code `code` (0-255). */
export const charArt = (code: number): PixelArt => CHARS[code & 0xff] ?? BLANK;

/** The sprite with code `code` (0-63), mirrored as `flip` says. */
export const spriteArt = (code: number, flip: Flip): PixelArt =>
  SPRITES[code & 0x3f]?.[flipIndex(flip)] ?? BLANK;
