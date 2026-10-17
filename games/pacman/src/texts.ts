import { ROM_TEXTS } from './rom/texts';
import type { CellWrite, VideoWrites } from './video';

/** A message of the text routine at $2C5E, as stored in the ROM. */
export interface RomText {
  /** Video address of the first tile. */
  readonly offset: number;
  /**
   * Whether the message is on a score row, where the next cell is 1 address lower; in the
   * playfield the next cell to the right is 32 addresses lower.
   */
  readonly alongRow: boolean;
  /** Tile codes: letters are ASCII, "@" ($40) is a space. */
  readonly tiles: readonly number[];
  /** One color per tile. */
  readonly colors: readonly number[];
}

/** The numbers of the messages the game shows, as the program passes them to $2C5E. */
export const TEXT = {
  highScore: 0,
  credit: 1,
  playerOne: 3,
  gameOver: 5,
  ready: 6,
  pushStart: 7,
  onePlayerOnly: 8,
  bonusPacMan: 10,
  copyright: 11,
  characterNickname: 12,
  dotPoints: 17,
  energizerPoints: 18,
} as const;

/** The space tile: the routine writes it over a message to erase it. */
const SPACE = 0x40;

/** The writes that show message `number`, or that blank it when `erase` is set. */
export const textWrites = (number: number, erase = false): VideoWrites => {
  const text = ROM_TEXTS[number];
  if (text === undefined) return {};
  const step = text.alongRow ? -1 : -0x20;
  /** The cell of the `index`-th tile. */
  const cell = (index: number, value: number): CellWrite => ({
    address: text.offset + index * step,
    value,
  });
  return {
    tiles: text.tiles.map((tile, i) => cell(i, erase ? SPACE : tile)),
    colors: text.colors.map((color, i) => cell(i, color)),
  };
};
