import { EXTRA_LIFE } from './rom/main-rom';
import { applyAll, attractColors, clearPlayfield } from './screen';
import { TEXT, textWrites } from './texts';
import type { CellWrite, Video, VideoWrites } from './video';

/** Credits are a BCD byte: at most 99 ($4E6E). */
export const MAX_CREDITS = 99;

/** The tile of a digit. */
const digit = (value: number): number => 0x30 + value;

/**
 * "CREDIT" and the number of credits on the bottom row (routine $2BA1): the tens only when
 * there are some.
 */
export const creditWrites = (credits: number): VideoWrites => {
  const text = textWrites(TEXT.credit);
  const tens = Math.floor(credits / 10);
  const digits: readonly CellWrite[] = [
    ...(tens > 0 ? [{ address: 0x034, value: digit(tens) }] : []),
    { address: 0x033, value: digit(credits % 10) },
  ];
  return { ...text, tiles: [...(text.tiles ?? []), ...digits] };
};

/** "1UP" and "2UP" over the scores: tiles '1'/'2', 'U', 'P' from right to left (routine $0369). */
const upLabel = (address: number, player: number, shown: boolean): readonly CellWrite[] =>
  [0x50, 0x55, player].map((tile, i) => ({ address: address + i, value: shown ? tile : 0x40 }));

/**
 * The "1UP" and "2UP" labels (routine $032D): both steady before a game starts; during the
 * game "1UP" blinks with bit 4 of a frame counter and "2UP" is gone, as there is one player.
 */
export const upWrites = (inGame: boolean, counter: number): VideoWrites => ({
  tiles: [
    ...upLabel(0x3d8, 0x31, !inGame || (counter & 0x10) === 0),
    ...upLabel(0x3c5, 0x32, !inGame),
  ],
});

/** The bonus life's thousands next to "BONUS PAC-MAN FOR" (task $1F at $26B2), or none. */
const bonusWrites = (extraLifeSetting: number): readonly VideoWrites[] => {
  const bcd = EXTRA_LIFE[extraLifeSetting] ?? 0xff;
  if (bcd === 0xff) return [];
  const high = bcd >> 4;
  return [
    textWrites(TEXT.bonusPacMan),
    {
      tiles: [
        { address: 0x136, value: digit(bcd & 0x0f) },
        ...(high > 0 ? [{ address: 0x156, value: digit(high) }] : []),
      ],
    },
  ];
};

/**
 * The screen that waits for the start button (routine $05F3): "PUSH START BUTTON", the
 * copyright, the bonus life, and "1 PLAYER ONLY" (routine $061B shows "1 OR 2 PLAYERS" with
 * more credits; the remake has one player, so it always shows the first).
 */
export const pushStartVideo = (video: Video, extraLifeSetting: number): Video =>
  applyAll(video, [
    clearPlayfield(),
    attractColors(),
    textWrites(TEXT.pushStart),
    textWrites(TEXT.copyright),
    ...bonusWrites(extraLifeSetting),
    textWrites(TEXT.onePlayerOnly),
  ]);
