import { INTRO_STEPS, introTimer, introVideo } from './attract';
import { chasePlaying, updateChase } from './chase';
import { MAX_CREDITS, pushStartVideo } from './credits';
import { readyStage, startGame } from './level-flow';
import { demoPlaying } from './restart';
import { SOUND, withSounds } from './sounds';
import type { GameState, Stage } from './stage';
import { tickTimer, timerDone } from './timers';
import { tuning } from './tuning.config';

/**
 * The attract mode and the coins (routines $03C8-$06A8): the ghosts introduced, the chase,
 * the demo game; a coin leads to "PUSH START BUTTON", and the start button to a game.
 */

/** Whether the program is playing by itself: the attract mode ($4E00 = 1). */
export const inAttract = (state: GameState): boolean => state.playing.demo;

/** The next step of the introduction, or the chase after the last one ($04E0). */
const nextIntroStep = (state: GameState, step: number): GameState => {
  const next = INTRO_STEPS[step];
  if (next === undefined) {
    return {
      ...state,
      playing: chasePlaying(state.playing),
      stage: { kind: 'chase', released: 0 },
    };
  }
  return {
    ...state,
    playing: { ...state.playing, video: introVideo(state.playing.video, next) },
    stage: { kind: 'intro', step, timer: introTimer(next) },
  };
};

/** One frame of the introduction: wait for the step's timer, then the next step. */
export const updateIntro = (
  state: GameState,
  stage: Extract<Stage, { kind: 'intro' }>,
): GameState => {
  const timer = tickTimer(stage.timer, state.frame);
  return timerDone(timer)
    ? nextIntroStep(state, stage.step + 1)
    : { ...state, stage: { ...stage, timer } };
};

/** One frame of the chase; at its end the demo game starts ($057C). */
export const chaseFrame = (state: GameState, released: number): GameState => {
  const chase = updateChase(state.playing, released);
  return chase.over
    ? { ...state, playing: demoPlaying(chase.playing), stage: readyStage() }
    : { ...state, playing: chase.playing, stage: { kind: 'chase', released: chase.released } };
};

/** A coin: one more credit, with its sound ($02DF-$02F7). */
export const insertCoin = (state: GameState): GameState => ({
  ...state,
  credits: Math.min(state.credits + 1, MAX_CREDITS),
  playing: withSounds(state.playing, SOUND.credit),
});

/** "PUSH START BUTTON" as soon as there is a credit in the attract mode ($0401). */
export const toPushStart = (state: GameState): GameState => ({
  ...state,
  playing: {
    ...state.playing,
    demo: false,
    video: pushStartVideo(state.playing.video, tuning.extraLifeSetting),
  },
  stage: { kind: 'pushStart' },
});

/** The start button spends a credit and starts a game ($0649-$0673). */
export const pressStart = (state: GameState): GameState =>
  startGame({ ...state, credits: state.credits - 1 });
