/*
 * `f_2000`: the rescue. A Boss carrying a captured fighter was shot while diving: the fighter,
 * white again, spins in place, then glides to the middle of the screen and down next to the
 * player's fighter. The two join into the double fighter; if the player's fighter was lost
 * meanwhile, the rescued one simply takes its place.
 */
import { withTasks } from './capture-state';
import { setTimer } from './clock';
import { spin } from './capture-fighter';
import { DUAL_SPACING, FIGHTER_COLOR, FIGHTER_START, FIGHTER_UPRIGHT } from './fighter';
import {
  DISPOSITION,
  FIGHTER,
  FIGHTER_2,
  objectAt,
  updateObject,
  type GameObject,
} from './objects';
import { flyingCount, type PlayingState } from './playing';

/** Where the rescued fighter lands: the middle of the screen, then the bottom row. */
const LANDING_X = 0x80;
const MAIN_X = LANDING_X - DUAL_SPACING;

/** One pixel closer to `target`. */
const toward = (value: number, target: number): number =>
  value === target ? value : value + (((target - value) & 0x80) === 0 ? 1 : -1);

/** The rescued fighter changed by `change`. */
const changeRescued = (
  state: PlayingState,
  change: (fighter: GameObject) => GameObject,
): PlayingState => ({
  ...state,
  objects: updateObject(state.objects, state.capture.object, change),
});

/** `l_20BF`: the rescue is over. */
const endRescue = (state: PlayingState): PlayingState => ({
  ...state,
  capture: withTasks(state.capture, { rescue: false }),
});

/** `l_2097`: the two fighters join; the rescued one becomes the second, or the only one. */
const join = (state: PlayingState): PlayingState => {
  const rescued = objectAt(state.objects, state.capture.object);
  const mainUpright = objectAt(state.objects, FIGHTER).code === FIGHTER_UPRIGHT;
  const target = mainUpright ? FIGHTER_2 : FIGHTER;
  const objects = updateObject(
    updateObject(state.objects, state.capture.object, (o) => ({
      ...o,
      x: 0,
      disposition: DISPOSITION.inactive,
    })),
    target,
    (o) => ({
      ...o,
      x: LANDING_X,
      y: rescued.y,
      code: FIGHTER_UPRIGHT,
      color: FIGHTER_COLOR,
      flipX: false,
      flipY: false,
      big: false,
      disposition: DISPOSITION.inactive,
    }),
  );
  return endRescue({
    ...state,
    objects,
    dual: mainUpright,
    capture: mainUpright ? state.capture : { ...state.capture, busy: false },
    tasks: { ...state.tasks, stick: true, fire: true, fighterHits: true },
    starControl: { ...state.starControl, shipOnScreen: true },
  });
};

/** `l_2026`-`l_2075`: the rescued fighter glides down while the player's moves aside. */
const land = (state: PlayingState): PlayingState => {
  const rescued = objectAt(state.objects, state.capture.object);
  const landed =
    rescued.x !== LANDING_X
      ? changeRescued(state, (o) => ({ ...o, x: toward(o.x, LANDING_X) }))
      : rescued.y === FIGHTER_START.y
        ? { ...state, capture: { ...state.capture, step: 3 } }
        : changeRescued(state, (o) => ({ ...o, y: o.y + 1 }));
  const main = objectAt(landed.objects, FIGHTER);
  if (main.code === FIGHTER_UPRIGHT && main.x !== MAIN_X) {
    return {
      ...landed,
      objects: updateObject(landed.objects, FIGHTER, (o) => ({ ...o, x: toward(o.x, MAIN_X) })),
    };
  }
  return landed.capture.step === 3 ? join(landed) : landed;
};

/**
 * `l_20D1`: the rescued fighter spins while aliens still fly; when it stops, the player's
 * fighter stops too until the two have joined.
 */
const spinInPlace = (state: PlayingState): PlayingState => {
  const keepSpinning = state.timers[1] !== 0 || flyingCount(state) !== 0;
  const spun = spin(objectAt(state.objects, state.capture.object), keepSpinning);
  const spinning = changeRescued(state, () => spun.object);
  if (!spun.upright) return spinning;
  return {
    ...spinning,
    capture: { ...spinning.capture, step: 2 },
    tasks: { ...spinning.tasks, stick: false, fire: false, fighterHits: false },
  };
};

/** `f_2000`: one frame of the rescue. */
export const runRescue = (state: PlayingState): PlayingState => {
  const { capture } = state;
  if (!capture.tasks.rescue) return state;
  if (objectAt(state.objects, capture.object).disposition !== 0) return endRescue(state);
  switch (capture.step) {
    case 0:
      return {
        ...state,
        capture: { ...capture, step: 1 },
        timers: setTimer(state.timers, 1, 2),
      };
    case 1:
      return spinInPlace(state);
    default:
      return land(state);
  }
};
