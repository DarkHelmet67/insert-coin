import { startAttract } from './attract';
import type { Controls } from './controls';
import { deathOver } from './death';
import { updatePlaying } from './frame';
import { MAZE_FOOD } from './ghost-modes';
import { newIntermission, sceneAfter, updateIntermission } from './intermission';
import { intermissionPlaying } from './intermission-moves';
import { newPlaying, roundOf, type Playing } from './playing';
import { firstLife, loseLife, nextLevel, nextLife } from './restart';
import { blankVideo, flashVideo } from './screen';
import { SOUND, withSounds } from './sounds';
import type { GameState, Stage } from './stage';
import { TEXT, textWrites } from './texts';
import { DELAY, tickTimer, timerDone, timerOf } from './timers';
import { writeVideo } from './video';

/**
 * The flow of a game, after the level state of the program ($4E04): the start, "READY!",
 * play, a life lost, the end of a level with its flashes and intermissions, game over. The
 * demo of the attract mode goes the same way.
 */

/** Flashes of the maze at the end of a level: white, blue, 4 times. */
const FLASHES = 8;

/** A game that starts now, with its music (routines $0668 and $0674). */
export const startGame = (state: GameState): GameState => ({
  ...state,
  stage: { kind: 'starting', timer: timerOf(DELAY.start) },
  playing: withSounds(newPlaying(state.playing.hiScore), SOUND.startMusic),
});

/** The "READY!" pause, with its own timer ($0899, $0988). */
export const readyStage = (): Stage => ({ kind: 'ready', timer: timerOf(DELAY.pause) });

/** One frame of play: the end of the level comes first, then the life lost ($08CD, $1366). */
const play = (state: GameState, controls: Controls): GameState => {
  if (state.playing.dotsEaten === MAZE_FOOD) {
    return {
      ...state,
      playing: withSounds(state.playing, SOUND.quiet),
      stage: { kind: 'cleared', timer: timerOf(DELAY.pause) },
    };
  }
  const playing = updatePlaying(state.playing, controls.joystick);
  return deathOver(playing.death)
    ? { ...state, playing: loseLife(playing), stage: { kind: 'lost' } }
    : { ...state, playing };
};

/** A life lost: "GAME OVER" if it was the last, otherwise the next one ($090D, $0940). */
const afterDeath = (state: GameState): GameState =>
  state.playing.lives === 0
    ? {
        ...state,
        playing: {
          ...state.playing,
          video: writeVideo(state.playing.video, textWrites(TEXT.gameOver)),
        },
        stage: { kind: 'gameOver', timer: timerOf(DELAY.pause) },
      }
    : { ...state, playing: nextLife(state.playing), stage: readyStage() };

/** The next flash of the maze, or the empty playfield after the last one. */
const nextFlash = (state: GameState, flash: number): GameState =>
  flash < FLASHES
    ? {
        ...state,
        playing: { ...state.playing, video: flashVideo(state.playing.video, flash % 2 === 0) },
        stage: { kind: 'flashing', flash, timer: timerOf(DELAY.flash) },
      }
    : {
        ...state,
        playing: { ...state.playing, video: blankVideo(state.playing.video) },
        stage: { kind: 'blank', timer: timerOf(DELAY.cleared) },
      };

/** The next level, with no song playing ($0A7C). */
const toNextLevel = (state: GameState, playing: Playing): GameState => ({
  ...state,
  playing: withSounds(nextLevel(playing), SOUND.noSongs),
  stage: readyStage(),
});

/** After the empty playfield: the intermission due after this level, or the next level ($0A2C). */
const afterBlank = (state: GameState): GameState => {
  const scene = sceneAfter(roundOf(state.playing));
  return scene === undefined
    ? toNextLevel(state, state.playing)
    : {
        ...state,
        playing: intermissionPlaying(state.playing),
        stage: { kind: 'intermission', intermission: newIntermission(scene) },
      };
};

/** What happens when the stage's timer runs out. */
const timeUp = (state: GameState): GameState => {
  const { stage, playing } = state;
  switch (stage.kind) {
    case 'starting':
      return { ...state, playing: firstLife(playing), stage: readyStage() };
    case 'ready':
      // The demo keeps its "GAME OVER": the program sets no timer to erase it ($09BA).
      return {
        ...state,
        playing: playing.demo
          ? playing
          : { ...playing, video: writeVideo(playing.video, textWrites(TEXT.ready, true)) },
        stage: { kind: 'playing' },
      };
    case 'gameOver':
      return startAttract(state);
    case 'cleared':
      return nextFlash(state, 0);
    case 'flashing':
      return nextFlash(state, stage.flash + 1);
    case 'blank':
      return afterBlank(state);
    case 'pause':
      return toNextLevel(state, playing);
    default:
      return state;
  }
};

/**
 * One frame of an intermission: the intermission music plays and voices 2 and 3 stay
 * quiet ($0A2C), then the scene; at its end, a pause or the next level.
 */
const intermissionFrame = (state: GameState, stage: Extract<Stage, { kind: 'intermission' }>) => {
  const playing = withSounds(state.playing, [...SOUND.quiet, ...SOUND.intermission]);
  const frame = updateIntermission(playing, stage.intermission, state.frame);
  if (frame.intermission !== undefined) {
    return {
      ...state,
      playing: frame.playing,
      stage: { kind: 'intermission' as const, intermission: frame.intermission },
    };
  }
  return frame.pause
    ? {
        ...state,
        playing: frame.playing,
        stage: { kind: 'pause' as const, timer: timerOf(DELAY.halfSecond) },
      }
    : toNextLevel(state, frame.playing);
};

/** One frame of a game's stage. */
export const updateLevel = (state: GameState, controls: Controls): GameState => {
  const { stage } = state;
  switch (stage.kind) {
    case 'playing':
      return play(state, controls);
    case 'lost':
      return afterDeath(state);
    case 'intermission':
      return intermissionFrame(state, stage);
    case 'intro':
    case 'chase':
    case 'pushStart':
      return state;
    default: {
      const timer = tickTimer(stage.timer, state.frame);
      return timerDone(timer) ? timeUp(state) : { ...state, stage: { ...stage, timer } };
    }
  }
};
