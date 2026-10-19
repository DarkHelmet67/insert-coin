/*
 * The capturing Boss and its tractor beam (`f_21CB`, `f_2222`). The Boss dives to the middle of
 * the screen above the fighter, turns upright and opens the beam one row of characters at a
 * time. The beam stays open for 64 frames: a fighter within 27 pixels of its center is caught.
 * Then the beam closes from the bottom; a Boss shot while beaming closes it from the top.
 */
import { ATTACK_PROGRAM } from './attacks';
import { setBeamRow, withTasks, type Capture } from './capture-state';
import { debug } from './debug';
import type { FlightSlot } from './flight-slot';
import { DISPOSITION, FIGHTER, objectAt } from './objects';
import type { PlayingState } from './playing';

/** The flight slot of the capturing Boss, changed by `change`. */
const changeBossSlot = (
  state: PlayingState,
  change: (slot: FlightSlot) => FlightSlot,
): PlayingState => ({
  ...state,
  slots: state.slots.map((slot, i) =>
    i === state.capture.slot && slot !== undefined ? change(slot) : slot,
  ),
});

/** Whether the capturing Boss is still diving (not shot, not home). */
const bossDiving = (state: PlayingState): boolean =>
  objectAt(state.objects, state.capture.object).disposition === DISPOSITION.flying;

/** The state with a new capture. */
const withCapture = (state: PlayingState, capture: Capture): PlayingState => ({
  ...state,
  capture,
});

/**
 * `f_21CB`: the Boss dives until its program stops it (speed 0), then turns 12 steps a frame
 * until it points up: the beam starts.
 */
export const approach = (state: PlayingState): PlayingState => {
  const { capture } = state;
  if (!capture.tasks.approach) return state;
  if (!bossDiving(state)) {
    return withCapture(state, withTasks({ ...capture, busy: false }, { approach: false }));
  }
  const slot = state.slots[capture.slot];
  if (slot === undefined || slot.speedOdd !== 0 || slot.speedEven !== 0) return state;
  const turn = (slot.angle & 0x100) !== 0 ? -0x0c & 0xff : 0x0c;
  const upright = ((((slot.angle >> 1) & 0xff) - 0x78) & 0xff) < 0x10;
  if (!upright) return changeBossSlot(state, (s) => ({ ...s, turn }));
  return changeBossSlot(
    withCapture(
      state,
      withTasks(
        {
          ...capture,
          beamSpeed: state.params.beamSpeed,
          step: 0,
          connected: false,
          countdown: 1,
          pulling: true,
        },
        { approach: false, beam: true },
      ),
    ),
    (s) => ({ ...s, turn: 0 }),
  );
};

/** `l_2327`: the Boss was shot while beaming: the beam closes fast, the fighter is free. */
const bossShot = (state: PlayingState): PlayingState => ({
  ...state,
  capture: { ...state.capture, beamSpeed: 3, step: 0x80, pulling: false, countdown: 1 },
  starControl: { ...state.starControl, backwards: false },
  tasks: { ...state.tasks, stick: true },
});

/** `l_22E3`: the beam is gone; the Boss flies on, or goes home with the fighter. */
const beamEnds = (state: PlayingState): PlayingState => {
  const capture = withTasks(state.capture, { beam: false });
  if (!capture.connected) {
    return changeBossSlot(withCapture(state, { ...capture, busy: false, object: 1 }), (s) => ({
      ...s,
      timer: 1,
    }));
  }
  return changeBossSlot(
    {
      ...state,
      capture: withTasks({ ...capture, showText: true }, { carry: true }),
      starControl: { ...state.starControl, backwards: false },
    },
    (s) => ({ ...s, pointer: ATTACK_PROGRAM.captureHome }),
  );
};

/** One step of a beam that is opening, holding or closing (`l_226A`). */
const beamStep = (state: PlayingState): PlayingState => {
  const capture = { ...state.capture, countdown: state.capture.beamSpeed };
  if ((capture.step & 0x80) !== 0) {
    // Shot while beaming: the rows are erased from the top.
    const step = capture.step + 1;
    const row = step & 0x0f;
    return row === 0x0b
      ? withCapture(state, withTasks({ ...capture, step, busy: false }, { beam: false }))
      : withCapture(state, setBeamRow({ ...capture, step }, row, false));
  }
  // The Boss hovers while the beam is on: its instruction never runs out.
  const hovering = changeBossSlot(state, (s) => ({ ...s, timer: 0xff }));
  const step = capture.step + 1;
  const row = step & 0x0f;
  if (row !== 0x0b) {
    const closing = (step & 0x40) !== 0;
    return withCapture(
      hovering,
      closing
        ? setBeamRow({ ...capture, step }, 0x0b - row, false)
        : setBeamRow({ ...capture, step }, row, true),
    );
  }
  if ((step & 0x40) === 0)
    return withCapture(hovering, { ...capture, step: 0x40, countdown: 0x40 });
  if (capture.connected && (step & 0x20) === 0) {
    return withCapture(hovering, { ...capture, step: 0x68 });
  }
  return beamEnds(withCapture(hovering, { ...capture, step }));
};

/**
 * `l_233D`: while the beam is fully open, a fighter within 27 pixels of its center is caught.
 * The joystick and the collisions stop, the stars run backwards. With the `noCapture` debug
 * option the beam opens and closes, but never catches.
 */
export const tryToCatch = (
  state: PlayingState,
  noCapture: boolean = debug.noCapture,
): PlayingState => {
  const { capture } = state;
  if (noCapture || capture.step !== 0x40) return state;
  const distance = (capture.beamX - objectAt(state.objects, FIGHTER).x + 0x1b) & 0xff;
  if (distance >= 0x36 || !state.tasks.stick || state.restart) return state;
  return {
    ...state,
    capture: withTasks({ ...capture, beamSpeed: 0x0a }, { pull: true }),
    tasks: { ...state.tasks, stick: false, fighterHits: false },
    starControl: { ...state.starControl, backwards: true },
  };
};

/** `f_2222`: one frame of the beam. */
export const runBeam = (state: PlayingState): PlayingState => {
  const { capture } = state;
  if (!capture.tasks.beam) return state;
  if ((capture.step & 0x80) === 0 && !bossDiving(state)) return bossShot(state);
  const countdown = capture.countdown - 1;
  if (countdown !== 0) return tryToCatch(withCapture(state, { ...capture, countdown }));
  return beamStep(state);
};
