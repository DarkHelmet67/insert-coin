/*
 * The texts the main program writes in the middle of the screen ("PLAYER 1", "STAGE 1",
 * "READY"...). The original writes them into the character memory and erases them by writing a
 * row of 27 spaces over them; the remake keeps a list of texts on screen.
 */

/** A text written at a character cell, in a character palette. */
export interface Message {
  readonly text: string;
  readonly column: number;
  readonly row: number;
  readonly palette: number;
}

/** The texts of the main program with their cells (`d_cstring_tbl`). */
export const MESSAGES = {
  playerOne: { text: 'PLAYER 1', column: 11, row: 18, palette: 0 },
  /** "PLAYER 1" above "STAGE 1", written at a fixed address by `plyr_respawn_plyrup`. */
  playerOneAbove: { text: 'PLAYER 1', column: 10, row: 16, palette: 0 },
  ready: { text: 'READY', column: 10, row: 18, palette: 0 },
  gameOver: { text: 'GAME OVER', column: 10, row: 18, palette: 0 },
  challengingStage: { text: 'CHALLENGING STAGE', column: 5, row: 18, palette: 0 },
  fighterCaptured: { text: 'FIGHTER CAPTURED', column: 6, row: 19, palette: 4 },
  numberOfHits: { text: 'NUMBER OF HITS', column: 5, row: 18, palette: 0 },
  bonus: { text: 'BONUS', column: 8, row: 21, palette: 0 },
  perfect: { text: 'PERFECT !', column: 10, row: 15, palette: 4 },
  specialBonus: { text: 'SPECIAL BONUS 10000 PTS', column: 2, row: 21, palette: 5 },
  results: { text: '-RESULTS-', column: 9, row: 17, palette: 4 },
  shotsFired: { text: 'SHOTS FIRED', column: 4, row: 20, palette: 5 },
  resultHits: { text: 'NUMBER OF HITS', column: 4, row: 23, palette: 5 },
  hitMissRatio: { text: 'HIT-MISS RATIO', column: 4, row: 26, palette: 3 },
} as const satisfies Readonly<Record<string, Message>>;

/** "STAGE n": the number is written after the text, from column 16. */
export const stageMessage = (stage: number): Message => ({
  text: `STAGE ${String(stage)}`,
  column: 10,
  row: 18,
  palette: 0,
});

/** The texts with `message` added. */
export const show = (messages: readonly Message[], message: Message): readonly Message[] => [
  ...messages.filter((m) => m.row !== message.row || m.column !== message.column),
  message,
];

/** The texts with row `row` erased (the 27 spaces of string $0B). */
export const eraseRow = (messages: readonly Message[], row: number): readonly Message[] =>
  messages.filter((m) => m.row !== row);

/** Whether a text starts at the cell. */
export const shownAt = (messages: readonly Message[], column: number, row: number): boolean =>
  messages.some((m) => m.row === row && m.column === column);
