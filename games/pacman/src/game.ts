import { introStage } from './attract';
import {
  chaseFrame,
  inAttract,
  insertCoin,
  pressStart,
  toPushStart,
  updateIntro,
} from './attract-flow';
import type { Controls } from './controls';
import { creditWrites, upWrites } from './credits';
import { FRUIT_TEXTS_ERASED } from './fruit';
import { updateLevel } from './level-flow';
import { newPlaying, type Playing } from './playing';
import { HIGH_SCORE_ADDRESS, SCORE_ADDRESS, scoreWrites } from './score';
import { applyAll } from './screen';
import type { GameState } from './stage';
import { TEXT, textWrites } from './texts';
import { tickTimer, timerDone } from './timers';
import { filledVideo, writeVideo } from './video';
import { TILE } from './maze';

export type { GameState, Stage } from './stage';

/**
 * The screen at power-on (tasks at $03DC): empty, with "HIGH SCORE", the first player's score
 * at zero and the record the browser kept, then the attract mode starts.
 */
export const createGame = (hiScore: number): GameState => {
  const playing = newPlaying(hiScore);
  const video = applyAll(filledVideo(TILE.space, 0), [
    textWrites(TEXT.highScore),
    {
      tiles: [
        ...scoreWrites(0, SCORE_ADDRESS),
        ...(hiScore > 0 ? scoreWrites(hiScore, HIGH_SCORE_ADDRESS) : []),
      ],
    },
  ]);
  return { frame: 0, credits: 0, ...introStage({ ...playing, video }) };
};

/**
 * The timed tasks of the fruit, which run in every stage ($0221): the fruit goes away after
 * 10 seconds ($1000), its points after 2 ($100B).
 */
const tickFruitTasks = (playing: Playing, frame: number): Playing => {
  const fruitTimer = playing.fruitTimer && tickTimer(playing.fruitTimer, frame);
  const textTimer = playing.fruitTextTimer && tickTimer(playing.fruitTextTimer, frame);
  const fruitGone = fruitTimer !== undefined && timerDone(fruitTimer);
  const textGone = textTimer !== undefined && timerDone(textTimer);
  return {
    ...playing,
    fruit: fruitGone ? undefined : playing.fruit,
    fruitTimer: fruitGone ? undefined : fruitTimer,
    fruitTextTimer: textGone ? undefined : textTimer,
    video: textGone
      ? FRUIT_TEXTS_ERASED.reduce(
          (video, text) => writeVideo(video, textWrites(text, true)),
          playing.video,
        )
      : playing.video,
  };
};

/** The stage of the machine for one frame: start screen, attract mode or game. */
const updateStage = (state: GameState, controls: Controls): GameState => {
  const { stage } = state;
  if (stage.kind === 'pushStart') return controls.start ? pressStart(state) : state;
  if (inAttract(state) && state.credits > 0) return toPushStart(state);
  if (stage.kind === 'intro') return updateIntro(state, stage);
  if (stage.kind === 'chase') return chaseFrame(state, stage.released);
  return updateLevel(state, controls);
};

/**
 * What the program writes on the score rows every frame: the "1UP" and "2UP" labels
 * (routine $032D) and, outside a game, the credits (routine $2BA1).
 */
const scoreRows = (state: GameState): GameState => {
  const inGame = !inAttract(state) && state.stage.kind !== 'pushStart';
  const video = applyAll(state.playing.video, [
    upWrites(inGame, state.playing.upClock),
    ...(inGame ? [] : [creditWrites(state.credits)]),
  ]);
  return { ...state, playing: { ...state.playing, video } };
};

/**
 * One frame of the machine: its clock, the timed tasks, the coins, then the stage. The sound
 * writes start empty and collect what this frame asks of the sound program.
 */
export const updateGame = (state: GameState, controls: Controls): GameState => {
  const frame = state.frame + 1;
  const playing = {
    ...tickFruitTasks(state.playing, frame),
    upClock: (state.playing.upClock + 1) & 0xff,
    sounds: [],
  };
  const ticked = { ...state, frame, playing };
  const coined = controls.coin ? insertCoin(ticked) : ticked;
  return scoreRows(updateStage(coined, controls));
};
