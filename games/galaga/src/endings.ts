/*
 * The two scripted sequences of the main program: the results of a challenging stage
 * (`gctl_chllng_stg_end`) and the end of the game (`gctl_plyr_terminate`). The original runs
 * them as straight code with pauses (`c_tdelay_3`); the remake keeps a list of lines, each an
 * action followed by a wait.
 */
import { setTimer } from './clock';
import { addPoints } from './extra-lives';
import { eraseRow, MESSAGES, show, type Message } from './messages';
import { emptyObjects } from './objects';
import { play, type PlayingState } from './playing';

/** What a line waits for before the next one runs. */
export type Wait =
  /** `c_tdelay_3`: game timer 3 set to 3 ticks, about a second and a half. */
  | 'pause'
  /** The next frame whose number is a multiple of 16 (the blinking of "PERFECT !"). */
  | 'blink'
  /** The tractor beam has finished (`l_0509`). */
  | 'beam'
  /** Game timer 2 set to 14 ticks: the results stay on screen for about 7 seconds. */
  | 'results';

/** One line of a script. */
export interface ScriptLine {
  readonly run: (state: PlayingState) => PlayingState;
  readonly wait: Wait;
}

/** The scripts, by name. */
export type ScriptName = 'challenge' | 'perfect' | 'gameOver';

/** Aliens of a challenging stage: all 40 shot is a "perfect". */
const CHALLENGE_ALIENS = 40;

/** A number written at a cell in the palette of the text before it. */
const number = (value: number | string, column: number, row: number, palette: number): Message => ({
  text: String(value),
  column,
  row,
  palette,
});

/** The state with `message` shown. */
const showing =
  (message: Message) =>
  (state: PlayingState): PlayingState => ({ ...state, messages: show(state.messages, message) });

/** Nothing to do: the line only waits. */
const nothing = (state: PlayingState): PlayingState => state;

/** The results of a challenging stage start with their tune. */
const firstLine = (state: PlayingState): ScriptLine => ({
  run: (s) => play(s, state.flyingHits === CHALLENGE_ALIENS ? 'perfect' : 'challengeEnd'),
  wait: 'pause',
});

/** "NUMBER OF HITS" and the number, shared by both endings of a challenging stage. */
const hitsLines: readonly ScriptLine[] = [
  { run: showing(MESSAGES.numberOfHits), wait: 'pause' },
  {
    run: (s) => showing(number(s.flyingHits, 21, MESSAGES.numberOfHits.row, 0))(s),
    wait: 'pause',
  },
];

/** The rows of the challenge results are erased (with "PERFECT !"). */
const eraseResults = (state: PlayingState): PlayingState => ({
  ...state,
  messages: [MESSAGES.perfect.row, MESSAGES.numberOfHits.row, MESSAGES.bonus.row].reduce(
    eraseRow,
    state.messages,
  ),
});

/** `l_0699`: "PERFECT !" blinks 7 times, a phase every 16 frames, ending shown. */
const blinkLines: readonly ScriptLine[] = Array.from({ length: 7 }, (_, i) => 7 - i).map(
  (b): ScriptLine => ({
    run: (s) =>
      (b & 1) === 1
        ? showing(MESSAGES.perfect)(s)
        : { ...s, messages: eraseRow(s.messages, MESSAGES.perfect.row) },
    wait: 'blink',
  }),
);

/** The challenge stage results: with fewer than 40 hits, a bonus of 100 points per hit. */
const challengeScript: readonly ScriptLine[] = [
  ...hitsLines,
  { run: showing(MESSAGES.bonus), wait: 'pause' },
  {
    run: (s) =>
      addPoints(
        showing(number(s.flyingHits === 0 ? '0' : `${String(s.flyingHits)}00`, 15, 21, 0))(s),
        s.flyingHits * 100,
      ),
    wait: 'pause',
  },
  { run: nothing, wait: 'pause' },
  { run: eraseResults, wait: 'pause' },
];

/** All 40 aliens shot: "PERFECT !" and a special bonus of 10000 points. */
const perfectScript: readonly ScriptLine[] = [
  ...hitsLines,
  { run: nothing, wait: 'blink' },
  ...blinkLines,
  { run: (s) => addPoints(showing(MESSAGES.specialBonus)(s), 10000), wait: 'pause' },
  { run: nothing, wait: 'pause' },
  { run: eraseResults, wait: 'pause' },
];

/**
 * `c_0A72_puts_hitmiss_ratio`: hits per 100 shots with one decimal, rounded; no leading zeros,
 * so a ratio under 1% starts with the dot.
 */
export const hitRatio = (hits: number, shots: number): string => {
  const hundredths = shots === 0 ? 0 : Math.floor((hits * 10000) / shots);
  const tenths = Math.floor(hundredths / 10) + (hundredths % 10 >= 5 ? 1 : 0);
  const whole = Math.floor(tenths / 10);
  return `${whole === 0 ? '' : String(whole)}.${String(tenths % 10)} %`;
};

/** `l_04FD`: "GAME OVER", then the screen clears and the results of the game appear. */
const gameOverScript: readonly ScriptLine[] = [
  { run: showing(MESSAGES.gameOver), wait: 'pause' },
  { run: nothing, wait: 'pause' },
  { run: nothing, wait: 'beam' },
  {
    run: (s) => ({
      ...s,
      objects: emptyObjects(),
      slots: s.slots.map(() => undefined),
      messages: [
        MESSAGES.results,
        MESSAGES.shotsFired,
        number(s.shots, 20, MESSAGES.shotsFired.row, MESSAGES.shotsFired.palette),
        MESSAGES.resultHits,
        number(s.hits, 20, MESSAGES.resultHits.row, MESSAGES.resultHits.palette),
        MESSAGES.hitMissRatio,
        number(hitRatio(s.hits, s.shots), 20, MESSAGES.hitMissRatio.row, 3),
      ],
      starControl: { ...s.starControl, shipOnScreen: false },
    }),
    wait: 'results',
  },
  { run: (s) => ({ ...s, messages: [] }), wait: 'pause' },
];

/** The lines of a script; the challenge results depend on the hits of the stage. */
export const scriptLines = (name: ScriptName, state: PlayingState): readonly ScriptLine[] => {
  switch (name) {
    case 'challenge':
      return [firstLine(state), ...challengeScript];
    case 'perfect':
      return [firstLine(state), ...perfectScript];
    case 'gameOver':
      return gameOverScript;
  }
};

/** The state after `wait` has been set up, right after a line has run. */
export const startWait = (state: PlayingState, wait: Wait): PlayingState => {
  switch (wait) {
    case 'pause':
      return { ...state, timers: setTimer(state.timers, 3, 3) };
    case 'results':
      return { ...state, timers: setTimer(state.timers, 2, 0x0e) };
    case 'blink':
    case 'beam':
      return state;
  }
};

/** Whether `wait` is over in this frame. */
export const waitOver = (state: PlayingState, wait: Wait): boolean => {
  switch (wait) {
    case 'pause':
      return state.timers[3] === 0;
    case 'results':
      return state.timers[2] === 0;
    case 'blink':
      return (state.frame & 0x0f) === 0;
    case 'beam':
      return !state.capture.tasks.beam;
  }
};
