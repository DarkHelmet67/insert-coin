import { applyAll, attractColors, clearPlayfield } from './screen';
import { textWrites } from './texts';
import { DELAY, timerOf, type Timer } from './timers';
import type { CellWrite, Video, VideoWrites } from './video';
import type { Playing } from './playing';
import type { GameState, Stage } from './stage';

/**
 * The first part of the attract mode (states 0-29 of $4E02, table at $0417): the ghosts are
 * introduced one by one with their picture, nickname and name, then the points of the dots.
 * Each even state writes something and starts a timer; the odd state after it waits.
 */

/** A ghost's picture: 2 × 3 tiles in the ghost's color (routine $05BF). */
interface Picture {
  readonly address: number;
  readonly color: number;
}

/** What one state of the sequence writes, and how long it waits afterwards. */
export interface IntroStep {
  /** Empties the playfield first (state 0: tasks $00 and $01). */
  readonly clear?: boolean;
  readonly picture?: Picture;
  /** Message numbers for the text routine at $2C5E. */
  readonly texts: readonly number[];
  readonly wait: number;
}

/** A second for a picture or a name, half a second for a nickname ($0585, $0593). */
const LONG = DELAY.second;
const SHORT = DELAY.halfSecond;

/** "CHARACTER / NICKNAME", written again with each picture. */
const HEADING = 12;

/** The sequence, from the program's table: Blinky, Pinky, Inky, Clyde, then the points. */
export const INTRO_STEPS: readonly IntroStep[] = [
  { clear: true, texts: [HEADING], wait: LONG },
  { picture: { address: 0x304, color: 1 }, texts: [HEADING], wait: LONG },
  { texts: [20], wait: SHORT }, // -SHADOW
  { texts: [13], wait: SHORT }, // "BLINKY"
  { picture: { address: 0x307, color: 3 }, texts: [HEADING], wait: LONG },
  { texts: [22], wait: SHORT }, // -SPEEDY
  { texts: [15], wait: SHORT }, // "PINKY"
  { picture: { address: 0x30a, color: 5 }, texts: [HEADING], wait: LONG },
  { texts: [51], wait: SHORT }, // -BASHFUL
  { texts: [47], wait: SHORT }, // "INKY"
  { picture: { address: 0x30d, color: 7 }, texts: [HEADING], wait: LONG },
  { texts: [53], wait: SHORT }, // -POKEY
  { texts: [49], wait: LONG }, // "CLYDE"
  { texts: [17, 18], wait: LONG }, // 10 PTS, 50 PTS
  { texts: [19], wait: LONG }, // © 1980 MIDWAY MFG.CO.
];

/** The tiles of a ghost's picture, two rows of three ($05BF-$05D1). */
const PICTURE_TILES: readonly (readonly [number, number])[] = [
  [0x00, 0xb1],
  [0x01, 0xb3],
  [0x02, 0xb5],
  [0x20, 0xb0],
  [0x21, 0xb2],
  [0x22, 0xb4],
];

/** The writes that draw a ghost's picture. */
export const pictureWrites = ({ address, color }: Picture): VideoWrites => {
  /** One cell of the picture. */
  const cell = (offset: number, value: number): CellWrite => ({ address: address + offset, value });
  return {
    tiles: PICTURE_TILES.map(([offset, tile]) => cell(offset, tile)),
    colors: PICTURE_TILES.map(([offset]) => cell(offset, color)),
  };
};

/** The screen after one step of the sequence. */
export const introVideo = (video: Video, step: IntroStep): Video =>
  applyAll(video, [
    ...(step.clear === true ? [clearPlayfield(), attractColors()] : []),
    ...(step.picture === undefined ? [] : [pictureWrites(step.picture)]),
    ...step.texts.map((text) => textWrites(text)),
  ]);

/** The step's timer. */
export const introTimer = (step: IntroStep): Timer => timerOf(step.wait);

/** The first step of the sequence, started now. */
export const introStage = (playing: Playing): { stage: Stage; playing: Playing } => {
  const [first] = INTRO_STEPS;
  return first === undefined
    ? { stage: { kind: 'chase', released: 0 }, playing }
    : {
        stage: { kind: 'intro', step: 0, timer: introTimer(first) },
        playing: { ...playing, demo: true, video: introVideo(playing.video, first) },
      };
};

/**
 * Back to the attract mode after a game or a demo (routine $0972): the program plays by
 * itself again, from the start of the sequence.
 */
export const startAttract = (state: GameState): GameState => ({
  ...state,
  ...introStage(state.playing),
});
