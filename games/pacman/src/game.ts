import type { Controls } from './controls';
import { deathOver } from './death';
import { FRUIT_TEXTS_ERASED } from './fruit';
import { MAZE_FOOD } from './ghost-modes';
import { updatePlaying } from './frame';
import { newPlaying, type Playing } from './playing';
import { firstLife, loseLife, nextLevel, nextLife } from './restart';
import { blankVideo, flashVideo } from './screen';
import { TEXT, textWrites } from './texts';
import { DELAY, tickTimer, timerDone, timerOf, type Timer } from './timers';
import { writeVideo } from './video';
import { SOUND, withSounds } from './sounds';

/**
 * Where the game is, after the level state of the program ($4E04): the start, "READY!", play,
 * a life lost, the end of a level with its flashes, game over.
 */
export type Stage =
  /** A game has just started: maze, "PLAYER ONE" and "READY!", no actors yet ($4E03). */
  | { readonly kind: 'starting'; readonly timer: Timer }
  /** The actors in their places under "READY!" ($4E04 = 2 or $0A). */
  | { readonly kind: 'ready'; readonly timer: Timer }
  | { readonly kind: 'playing' }
  /** The death animation is over and the life is gone ($4E04 = 4). */
  | { readonly kind: 'lost' }
  | { readonly kind: 'gameOver'; readonly timer: Timer }
  /** The game is over: a coin starts another. */
  | { readonly kind: 'over' }
  /** All the dots eaten: everything stands still ($09D8). */
  | { readonly kind: 'cleared'; readonly timer: Timer }
  /** The maze flashes white and blue, 8 times ($09E8-$0A0C). */
  | { readonly kind: 'flashing'; readonly flash: number; readonly timer: Timer }
  /** The playfield empty before the next level ($0A0E). */
  | { readonly kind: 'blank'; readonly timer: Timer };

/** The whole game. */
export interface GameState {
  /** Frames since power-on: the timers count on this clock ($4C84). */
  readonly frame: number;
  readonly stage: Stage;
  readonly playing: Playing;
}

/** Flashes of the maze at the end of a level: white, blue, 4 times. */
const FLASHES = 8;

/** A game that starts now. */
const startGame = (frame: number, hiScore: number): GameState => ({
  frame,
  stage: { kind: 'starting', timer: timerOf(DELAY.start) },
  playing: withSounds(newPlaying(hiScore), SOUND.startMusic),
});

/** The game at power-on, with the record saved by the browser. */
export const createGame = (hiScore: number): GameState => startGame(0, hiScore);

/** The "READY!" pause, with its own timer ($0899, $0988). */
const ready = (): Stage => ({ kind: 'ready', timer: timerOf(DELAY.pause) });

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
    : { ...state, playing: nextLife(state.playing), stage: ready() };

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

/** What happens when the stage's timer runs out. */
const timeUp = (state: GameState): GameState => {
  const { stage, playing } = state;
  switch (stage.kind) {
    case 'starting':
      return { ...state, playing: firstLife(playing), stage: ready() };
    case 'ready':
      return {
        ...state,
        playing: { ...playing, video: writeVideo(playing.video, textWrites(TEXT.ready, true)) },
        stage: { kind: 'playing' },
      };
    case 'gameOver':
      return { ...state, stage: { kind: 'over' } };
    case 'cleared':
      return nextFlash(state, 0);
    case 'flashing':
      return nextFlash(state, stage.flash + 1);
    case 'blank':
      return {
        ...state,
        playing: withSounds(nextLevel(playing), SOUND.noSongs),
        stage: ready(),
      };
    default:
      return state;
  }
};

/** One frame of a stage. */
const updateStage = (state: GameState, controls: Controls): GameState => {
  const { stage } = state;
  if (stage.kind === 'playing') return play(state, controls);
  if (stage.kind === 'lost') return afterDeath(state);
  if (stage.kind === 'over') {
    if (!controls.coin) return state;
    const started = startGame(state.frame, state.playing.hiScore);
    return {
      ...started,
      playing: withSounds(started.playing, SOUND.credit),
    };
  }
  const timer = tickTimer(stage.timer, state.frame);
  return timerDone(timer) ? timeUp(state) : { ...state, stage: { ...stage, timer } };
};

/**
 * One frame of the game: the machine's clock, the timed tasks, then the stage. The sound
 * writes start empty and collect what this frame asks of the sound program.
 */
export const updateGame = (state: GameState, controls: Controls): GameState => {
  const frame = state.frame + 1;
  const playing = { ...tickFruitTasks(state.playing, frame), sounds: [] };
  return updateStage({ ...state, frame, playing }, controls);
};
