/*
 * `c_new_level_tokens`: the stage badges in the bottom right corner. Stages are counted with
 * flags worth 50, 30, 20, 10, 5 and 1, like coins; each flag is one or two columns of two
 * characters, drawn from the left, the last one in the rightmost column.
 */

/** One column of a badge: the characters on rows 34 and 35, and their palette. */
export interface BadgeColumn {
  readonly top: number;
  readonly bottom: number;
  readonly palette: number;
}

/** A flag of `columns` columns starting at character `first`. */
interface Flag {
  readonly first: number;
  readonly columns: 1 | 2;
}

/** The flags of each value (character codes from the ROM, `c_build_token_2`). */
const ONE: Flag = { first: 0x36, columns: 1 };
const FIVE: Flag = { first: 0x38, columns: 1 };
const TEN: Flag = { first: 0x3a, columns: 2 };
const TWENTY: Flag = { first: 0x3e, columns: 2 };
const THIRTY: Flag = { first: 0x42, columns: 2 };
const FIFTY: Flag = { first: 0x46, columns: 2 };

/** The flags for the tens: 40 is a 30 and a 10. */
const TENS: readonly (readonly Flag[])[] = [[], [TEN], [TWENTY], [THIRTY], [THIRTY, TEN]];

/** The flags of `stage`, from the leftmost: one per "click" when they appear. */
export const stageFlags = (stage: number): readonly Flag[] => {
  const fifties = Math.floor(stage / 50);
  const rest = stage % 50;
  const fives = rest % 10 >= 5 ? [FIVE] : [];
  const ones = Array.from({ length: (rest % 10) % 5 }, () => ONE);
  return [
    ...Array.from({ length: fifties }, () => FIFTY),
    ...(TENS[Math.floor(rest / 10)] ?? []),
    ...fives,
    ...ones,
  ];
};

/** The columns of a flag. 1, 5 and 50 use palette 1, the others palette 2. */
const flagColumns = (flag: Flag): readonly BadgeColumn[] =>
  Array.from({ length: flag.columns }, (_, i) => ({
    top: flag.first + i * 2,
    bottom: flag.first + i * 2 + 1,
    palette: ((flag.first + i * 2 + 2) & 0x0c) === 8 ? 1 : 2,
  }));

/** The columns of the first `shown` flags of `stage`, from the leftmost. */
export const badgeColumns = (stage: number, shown: number): readonly BadgeColumn[] =>
  stageFlags(stage).slice(0, shown).flatMap(flagColumns);

/** The column of the rightmost badge column: the flags end at the right edge. */
export const BADGES_RIGHT = 27;
