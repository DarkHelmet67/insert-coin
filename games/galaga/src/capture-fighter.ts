/*
 * The captured fighter (`f_20F2`, `f_19B2`): it spins up the beam to the Boss, turns red, and
 * the Boss takes it home, where it rests above it as an enemy. "FIGHTER CAPTURED" is shown
 * meanwhile, and the stage restarts with the next fighter.
 */
import { withTasks } from './capture-state';
import { MESSAGES, eraseRow, show } from './messages';
import { DISPOSITION, FIGHTER, objectAt, updateObject, type GameObject } from './objects';
import { play, type PlayingState } from './playing';
import { setTimer } from './clock';

/** Sprite y of the fighter at the bottom of the screen, and where it meets the Boss. */
const BOTTOM_Y = 0x129;
const NO_FIRE_Y = 0xe6;
const CONNECTED_Y = 0xe0;

/** The red palette of a captured fighter. */
const CAPTURED_COLOR = 7;

/** Steps of 1 pixel that bring the captured fighter above its Boss, once home. */
const RISE_STEPS = 0x24;

/** The result of one step of a spin. */
export interface Spin {
  readonly object: GameObject;
  /** The fighter is upright again and was told to stop. */
  readonly upright: boolean;
}

/**
 * `c_2188_ship_spin`: one step of a fighter spinning clockwise. The 7 sprite codes 0-6 draw a
 * quarter turn; the two flip bits give the quarter, in Gray code. The screen is rotated, so the
 * hardware's first flip bit mirrors the sprite vertically. `keepSpinning` lets it go on past the
 * upright position.
 */
export const spin = (object: GameObject, keepSpinning: boolean): Spin => {
  const ctrl = (object.flipY ? 1 : 0) | (object.flipX ? 2 : 0);
  const pose = object.code & 7;
  const start = ctrl ^ (ctrl >> 1);
  if (pose === 6 && start === 0 && !keepSpinning) return { object, upright: true };
  /** Counts up in even quarters and down in odd ones, moving to the next quarter at the ends. */
  const turn = (quarter: number): { readonly quarter: number; readonly delta: number } => {
    const end = (quarter & 1) === 0 ? pose === 6 : pose === 0;
    if (end) return turn(quarter === 0 ? 3 : quarter - 1);
    return { quarter, delta: (quarter & 1) === 0 ? 1 : -1 };
  };
  const { quarter, delta } = turn(start);
  const flips = (quarter & 2) !== 0 ? quarter ^ 1 : quarter;
  return {
    object: {
      ...object,
      code: object.code + delta,
      flipX: (flips & 2) !== 0,
      flipY: (flips & 1) !== 0,
    },
    upright: false,
  };
};

/** The fighter changed by `change`. */
const changeFighter = (
  state: PlayingState,
  change: (fighter: GameObject) => GameObject,
): PlayingState => ({ ...state, objects: updateObject(state.objects, FIGHTER, change) });

/** One pixel closer to `target`. */
const toward = (value: number, target: number): number =>
  value === target ? value : value + (((target - value) & 0x80) === 0 ? 1 : -1);

/** `l_215D`: the fighter freed by a shot Boss drops back to the bottom, still spinning. */
const dropBack = (state: PlayingState, upright: boolean): PlayingState => {
  const fighter = objectAt(state.objects, FIGHTER);
  if (fighter.y !== BOTTOM_Y) return changeFighter(state, (o) => ({ ...o, y: o.y + 1 }));
  return upright ? endPull(state) : state;
};

/** `l_217F`: the pull is over; the fighter can be hit again. */
const endPull = (state: PlayingState): PlayingState => ({
  ...state,
  capture: withTasks(state.capture, { pull: false }),
  tasks: { ...state.tasks, fighterHits: true },
});

/** `f_20F2`: one frame of the fighter caught in the beam. */
export const pullFighter = (state: PlayingState): PlayingState => {
  const { capture } = state;
  if (!capture.tasks.pull) return state;
  const spun = spin(objectAt(state.objects, FIGHTER), capture.pulling);
  const spinning = changeFighter(state, () => spun.object);
  if (spun.upright && !state.tasks.fire) {
    return endPull({ ...spinning, capture: { ...capture, connected: true } });
  }
  if (spun.upright || (capture.step & 0x80) !== 0) return dropBack(spinning, spun.upright);
  if (!capture.pulling) return spinning;
  const boss = objectAt(state.objects, capture.object);
  const fighter = objectAt(spinning.objects, FIGHTER);
  const y = fighter.y - 1;
  const moved = changeFighter(spinning, (o) => ({ ...o, x: toward(o.x, boss.x), y }));
  if (y === NO_FIRE_Y) return { ...moved, tasks: { ...moved.tasks, fire: false } };
  if (y !== CONNECTED_Y) return moved;
  return {
    ...changeFighter(moved, (o) => ({ ...o, color: CAPTURED_COLOR })),
    capture: { ...capture, pulling: false },
  };
};

/** `l_19D2`: the fighter becomes the captured fighter of the Boss, above the text. */
const becomeCaptured = (state: PlayingState): PlayingState => {
  const captured = state.capture.object & 7;
  const fighter = objectAt(state.objects, FIGHTER);
  const objects = updateObject(
    updateObject(state.objects, captured, (o) => ({
      ...o,
      x: fighter.x,
      y: fighter.y,
      flipX: fighter.flipX,
      flipY: fighter.flipY,
      code: 7,
      color: CAPTURED_COLOR,
    })),
    FIGHTER,
    (o) => ({ ...o, x: 0 }),
  );
  return {
    ...state,
    objects,
    messages: show(state.messages, MESSAGES.fighterCaptured),
    timers: setTimer(state.timers, 1, 6),
    capture: { ...state.capture, step: 0, showText: false },
  };
};

/** `l_1A3F`: the Boss is home; the captured fighter climbs above it and rests. */
const joinFormation = (state: PlayingState): PlayingState => {
  const { capture } = state;
  const captured = capture.object & 7;
  const step = capture.step + 1;
  const shaped =
    capture.step === 0
      ? { ...state, objects: updateObject(state.objects, captured, (o) => ({ ...o, code: 6 })) }
      : state;
  if (capture.step === RISE_STEPS) {
    return {
      ...shaped,
      objects: updateObject(shaped.objects, captured, (o) => ({
        ...o,
        disposition: DISPOSITION.home,
      })),
      capture: withTasks({ ...capture, step, object: 1 }, { carry: false }),
      starControl: { ...shaped.starControl, shipOnScreen: true },
      restart: true,
    };
  }
  return {
    ...shaped,
    objects: updateObject(shaped.objects, captured, (o) => ({ ...o, y: o.y - 1 })),
    capture: { ...capture, step },
  };
};

/** `f_19B2`: one frame of the Boss carrying the captured fighter home. */
export const carryFighter = (state: PlayingState): PlayingState => {
  const { capture } = state;
  if (!capture.tasks.carry) return state;
  if (capture.showText) return becomeCaptured(state);
  const timer = state.timers[1];
  if (timer !== 0) {
    // While the text shows the Boss waits, its instruction kept from running out.
    const tune = timer === 4;
    const waiting: PlayingState = {
      ...state,
      timers: tune ? setTimer(state.timers, 1, 3) : state.timers,
      slots: state.slots.map((s, i) =>
        i === capture.slot && s !== undefined ? { ...s, timer: 4 } : s,
      ),
    };
    return tune ? play(waiting, 'fighterCaptured') : waiting;
  }
  const erased = { ...state, messages: eraseRow(state.messages, MESSAGES.fighterCaptured.row) };
  const boss = objectAt(state.objects, capture.object);
  if (boss.disposition !== DISPOSITION.flying) return joinFormation(erased);
  return {
    ...erased,
    objects: updateObject(erased.objects, capture.object & 7, (o) => ({
      ...o,
      x: boss.x,
      y: (boss.y + 0x10) & 0x1ff,
    })),
  };
};
