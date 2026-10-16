import { pausesAfter, SCENES, type Scene } from './intermission-scenes';
import type { Point } from './geometry';
import type { Playing } from './playing';
import { tickTimer, timerDone, timerOf, type Timer } from './timers';

export type { Scene } from './intermission-scenes';

/**
 * Where an intermission is: the scene, its step ($4E06, $4E07 or $4E08) and the timer the
 * step waits for, plus two things the sprite routine keeps across frames.
 */
export interface Intermission {
  readonly scene: Scene;
  readonly step: number;
  readonly timer: Timer | undefined;
  /**
   * Pac-Man has reached the last column on the left: his color is set to black ($163A) and
   * nothing in the scene gives it back.
   */
  readonly pacmanHidden: boolean;
  /** Where the sheet of the third scene is drawn ($4DD2). */
  readonly sheet: Point;
}

/**
 * The intermission after each level (table at $0A44, by the level counter): the first after
 * level 2, the second after level 5, the third after levels 9, 13 and 17.
 */
const SCENE_AFTER: Readonly<Record<number, Scene>> = { 1: 1, 4: 2, 8: 3, 12: 3, 16: 3 };

/** The intermission that follows the level counted `round` (0 for the first), if any. */
export const sceneAfter = (round: number): Scene | undefined => SCENE_AFTER[round];

/** An intermission at its first step. */
export const newIntermission = (scene: Scene): Intermission => ({
  scene,
  step: 0,
  timer: undefined,
  pacmanHidden: false,
  sheet: { x: 0, y: 0 },
});

/** The game and the intermission after one frame; `intermission` is gone when it is over. */
export interface IntermissionFrame {
  readonly playing: Playing;
  readonly intermission: Intermission | undefined;
  /** Half a second of pause comes before the next level ($2195, $2302). */
  readonly pause: boolean;
}

/** The last column on the left, where Pac-Man disappears in scenes 2 and 3 ($162D, $1652). */
const LAST_COLUMN = 0x3d;

/** One frame of an intermission at power-on frame `frame`. */
export const updateIntermission = (
  playing: Playing,
  intermission: Intermission,
  frame: number,
): IntermissionFrame => {
  if (intermission.timer !== undefined) {
    const timer = tickTimer(intermission.timer, frame);
    const next = timerDone(timer)
      ? { ...intermission, step: intermission.step + 1, timer: undefined }
      : { ...intermission, timer };
    return { playing, intermission: next, pause: false };
  }
  const step = SCENES[intermission.scene][intermission.step];
  const result = step === undefined ? { playing, done: true } : step(playing);
  if (result.done === true) {
    return {
      playing: result.playing,
      intermission: undefined,
      pause: pausesAfter(intermission.scene),
    };
  }
  const next: Intermission = {
    ...intermission,
    step: intermission.step + (result.advance === true ? 1 : 0),
    timer: result.timer === undefined ? undefined : timerOf(result.timer),
    pacmanHidden:
      intermission.pacmanHidden ||
      (intermission.scene !== 1 && result.playing.pacman.tile.x === LAST_COLUMN),
    sheet: result.sheet ?? intermission.sheet,
  };
  return { playing: result.playing, intermission: next, pause: false };
};
