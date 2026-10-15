import type { Controls } from './controls';
import { SLOT_COUNT, type BombDrift } from './flight';
import type { FlightSlot } from './flight-slot';
import { moveFighter, placeFighter } from './fighter';
import { initialFormation, type Formation } from './formation';
import { emptyObjects, type Objects } from './objects';
import { fireRocket, moveRockets, NO_PATHS, type RocketPath } from './rockets';
import type { SoundName } from './sound-names';
import { advanceStars, STARS_SLOW, type StarSpeed } from './stars';

/** The scrolling starfield: the shift register's phase and the speed chosen by the program. */
export interface StarField {
  readonly phase: number;
  readonly speed: StarSpeed;
}

/** Everything about a game in progress. */
export interface PlayingState {
  /** Frames since the game started (`ds3_92A0_frame_cts[0]`). */
  readonly frame: number;
  readonly objects: Objects;
  readonly slots: readonly (FlightSlot | undefined)[];
  readonly bombDrift: readonly BombDrift[];
  readonly rocketPaths: readonly RocketPath[];
  /** Alternating 1 and 2 pixel steps of the fighter. */
  readonly stepToggle: boolean;
  /** Two fighters side by side, after a rescue. */
  readonly dual: boolean;
  readonly formation: Formation;
  readonly stars: StarField;
  readonly score: number;
  /** Rockets fired and aliens hit, for the results at the end of the game. */
  readonly shots: number;
  readonly hits: number;
  /** Sounds started in this frame. */
  readonly sounds: readonly SoundName[];
}

/** A new game: the fighter at the bottom, the stars moving. */
export const initialPlayingState = (): PlayingState => ({
  frame: 0,
  objects: placeFighter(emptyObjects()),
  slots: Array.from({ length: SLOT_COUNT }, () => undefined),
  bombDrift: Array.from({ length: 8 }, () => ({ rate: 0, accumulator: 0 })),
  rocketPaths: NO_PATHS,
  stepToggle: false,
  dual: false,
  formation: initialFormation(),
  stars: { phase: 0, speed: STARS_SLOW },
  score: 0,
  shots: 0,
  hits: 0,
  sounds: [],
});

/** The fighter's part of a frame: move, fire, move the rockets. */
const updateFighter = (state: PlayingState, controls: Controls): PlayingState => {
  const moved = moveFighter(state.objects, state.stepToggle, controls.direction, state.dual);
  const firing = controls.fire
    ? fireRocket(moved.objects, state.rocketPaths, state.dual)
    : { objects: moved.objects, paths: state.rocketPaths, fired: false };
  return {
    ...state,
    objects: moveRockets(firing.objects, firing.paths),
    rocketPaths: firing.paths,
    stepToggle: moved.stepToggle,
    shots: state.shots + (firing.fired ? 1 : 0),
    sounds: firing.fired ? [...state.sounds, 'shot'] : state.sounds,
  };
};

/** One frame of play. */
export const updatePlaying = (state: PlayingState, controls: Controls): PlayingState => {
  const started: PlayingState = { ...state, frame: state.frame + 1, sounds: [] };
  return {
    ...updateFighter(started, controls),
    stars: { ...state.stars, phase: advanceStars(state.stars.phase, state.stars.speed) },
  };
};
