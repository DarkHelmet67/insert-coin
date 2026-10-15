/*
 * One frame of a game: the main program, then the tasks it has turned on, in the order the two
 * processors run them. Each task is a small pure function of the state.
 */
import { tickTimers } from './clock';
import { attack, collide, currentSettings, explode, fallBombs, isContinuous } from './combat';
import type { Controls } from './controls';
import { moveFighter } from './fighter';
import { carryFighter, pullFighter } from './capture-fighter';
import { withTasks } from './capture-state';
import { runFlights, type FlightEvent, type FlightInputs } from './flight';
import { runRescue } from './rescue';
import { approach, runBeam } from './tractor-beam';
import { breatheFormation, swayFormation } from './formation';
import { FIGHTER, objectAt } from './objects';
import { updateObjectStates } from './object-states';
import { flyingCount, play, type PlayingState } from './playing';
import { runProgram } from './program';
import { fireRocket, moveRockets } from './rockets';
import { controlStars } from './star-control';
import { advanceStars } from './stars';
import { isChallengeStage } from './stage-setup';
import { runLauncher } from './wave-launcher';

/** `f_1D76` and the star hardware: speed, then one frame of scrolling. */
const updateStars = (state: PlayingState): PlayingState => {
  const { control, speed } = controlStars(state.starControl);
  return {
    ...state,
    starControl: control,
    stars: { speed, phase: advanceStars(state.stars.phase, speed) },
  };
};

/** `f_2916`: the next alien of the attack waves. */
const runWaves = (state: PlayingState): PlayingState => {
  const result = runLauncher(
    { launcher: state.launcher, slots: state.slots, objects: state.objects },
    {
      frame: state.frame,
      enabled: state.wavesEnabled,
      flying: flyingCount(state),
      challenge: isChallengeStage(state.stage),
      timer: state.timers[0],
      looks: state.looks,
      entryBombBits: state.entryBombBits,
    },
  );
  const timers =
    result.timer === undefined
      ? state.timers
      : ([result.timer, state.timers[1], state.timers[2], state.timers[3]] as const);
  const updated = {
    ...state,
    launcher: result.launcher,
    slots: result.slots,
    objects: result.objects,
    timers,
    groupLeft: result.groupCountReset === true ? 8 : state.groupLeft,
  };
  return result.completed === true
    ? { ...updated, swayStops: true, tasks: { ...updated.tasks, attacks: true } }
    : updated;
};

/** `f_2A90` or `f_1DE6`: the grid sways while the waves enter, then breathes. */
const moveFormation = (state: PlayingState): PlayingState => {
  const { tasks } = state;
  if (tasks.sway) {
    if (state.alive === 0 && !state.launcher.running) {
      return { ...state, tasks: { ...tasks, sway: false } };
    }
    const { formation, settled } = swayFormation(state.formation, state.frame, state.swayStops);
    return settled
      ? play({ ...state, formation, tasks: { ...tasks, sway: false, breathing: true } }, 'pulse')
      : { ...state, formation };
  }
  return tasks.breathing
    ? { ...state, formation: breatheFormation(state.formation, state.frame) }
    : state;
};

/** What the flight programs read about the game. */
const flightInputs = (state: PlayingState): FlightInputs => ({
  frame: state.frame,
  fighterX: objectAt(state.objects, FIGHTER).x,
  continuousBombing: isContinuous(state),
  rescueRunning: state.capture.tasks.rescue,
  harderEntries: state.params.harderEntries,
  harderAttacks: state.params.harderAttacks,
  bombEnableBits: currentSettings(state).bombBits,
  bombInterval: state.bombInterval,
  bombsAllowed: state.tasks.fire && state.timers[1] === 0,
  formation: state.formation,
  bonusBeeLook: 0x1b,
});

/** `case_0A53`: the capturing Boss starts its dive: the beam will open above the fighter. */
const startCaptureDive = (state: PlayingState, event: FlightEvent): PlayingState =>
  event.kind === 'captureDive'
    ? {
        ...state,
        capture: withTasks(
          { ...state.capture, slot: event.slot, beamX: event.targetX, step: 0 },
          { approach: true },
        ),
      }
    : state;

/** `f_08D3` on the second processor: every flying alien follows its program. */
const flyAliens = (state: PlayingState): PlayingState => {
  const world = runFlights(
    { slots: state.slots, objects: state.objects, bombDrift: state.bombDrift, events: [] },
    flightInputs(state),
  );
  const flown = world.events.reduce(startCaptureDive, {
    ...state,
    slots: world.slots,
    objects: world.objects,
    bombDrift: world.bombDrift,
  });
  return world.events.some((event) => event.kind === 'diveSound') ? play(flown, 'dive') : flown;
};

/** `f_23DD`: the object manager. */
const manageObjects = (state: PlayingState): PlayingState => {
  const world = updateObjectStates(
    { objects: state.objects, slots: state.slots, counting: state.counting, alive: state.alive },
    { frame: state.frame, formation: state.formation, enemiesEnabled: state.enemiesEnabled },
  );
  return { ...state, ...world };
};

/** The fighter's part of a frame: move, fire, move the rockets. */
const updateFighter = (state: PlayingState, controls: Controls): PlayingState => {
  const direction = state.tasks.stick ? controls.direction : 0;
  const moved = moveFighter(state.objects, state.stepToggle, direction, state.dual);
  const firing =
    state.tasks.fire && controls.fire
      ? fireRocket(moved.objects, state.rocketPaths, state.dual)
      : { objects: moved.objects, paths: state.rocketPaths, fired: false };
  const updated = {
    ...state,
    objects: moveRockets(firing.objects, firing.paths),
    rocketPaths: firing.paths,
    stepToggle: moved.stepToggle,
    shots: state.shots + (firing.fired ? 1 : 0),
  };
  return firing.fired ? play(updated, 'shot') : updated;
};

/** One frame of play. */
export const updatePlaying = (state: PlayingState, controls: Controls): PlayingState => {
  const frame = state.frame + 1;
  const started: PlayingState = {
    ...state,
    frame,
    sounds: [],
    timers: tickTimers(state.timers, frame),
  };
  const tasks: readonly ((s: PlayingState) => PlayingState)[] = [
    runProgram,
    updateStars,
    runWaves,
    moveFormation,
    attack,
    carryFighter,
    runBeam,
    approach,
    pullFighter,
    runRescue,
    flyAliens,
    manageObjects,
    explode,
  ];
  const fought: readonly ((s: PlayingState) => PlayingState)[] = [fallBombs, collide];
  const moved = updateFighter(
    tasks.reduce((current, task) => task(current), started),
    controls,
  );
  return fought.reduce((current, task) => task(current), moved);
};
