import { abortFrame, ABORT_FRAMES, type AbortCount } from './abort';
import { followLander, startingCamera, type Camera } from './camera';
import { altitudeOf, hitsSurface, isTouchingDown, probesAt, type Probes } from './collision';
import { moveLever, type Controls } from './controls';
import { flyFrame, type Flight } from './flight';
import { isEmpty, type Tank } from './fuel';
import { landerOrientation, landerPosition, startingLander, type Lander } from './lander';
import { MISSIONS, type Mission } from './missions';
import { rotationAt } from './rotation';
import { chooseSites } from './sites';
import { leverThrust, type ThrustLevel } from './thrust';
import { tuning } from './tuning.config';

/**
 * A mission in flight: the module, its tank, the camera and the chosen sites, one frame at a
 * time [P MAINLP, PLYCHK]. Pure: `updateFlight` returns the next state and what happened.
 */

/** Everything that changes while the module flies. */
export interface FlightState {
  readonly mission: Mission;
  readonly flight: Flight;
  readonly camera: Camera;
  /** The thrust lever, 0 to 255: it stays where the player leaves it. */
  readonly lever: number;
  /** Thrust applied in the last frame, for the flame and the sound. */
  readonly thrust: ThrustLevel;
  /** Frames of ABORT left, 0 when the player is in control [P INDEX]. */
  readonly abort: AbortCount;
  /** The four sites with a bonus [P TABSIT]. */
  readonly sites: readonly number[];
  /** Frames since the mission began: the clock on the instruments. */
  readonly frames: number;
}

/** How a frame of flight ended. */
export type FlightEvent = 'flying' | 'touchdown' | 'crash' | 'flewOff';

/**
 * A new mission [P PLYINIT]: the module at the start, the tank as the last mission left it but
 * with its count of burned fuel cleared, four sites picked from `random`.
 */
export const startFlight = (mission: Mission, tank: Tank, random: number): FlightState => ({
  mission,
  flight: { lander: startingLander(), tank: { ...tank, used: 0 } },
  camera: startingCamera,
  lever: 0,
  thrust: 0,
  abort: 0,
  sites: chooseSites(random),
  frames: 0,
});

/** The probe points of the module with the current camera. */
export const landerProbes = (lander: Lander, camera: Camera): Probes => {
  const { x, y } = landerPosition(lander);
  return probesAt(x, y, landerOrientation(lander), camera.view);
};

/**
 * The event of a frame, from where the module ended up [P SCAPLND]: feet on the ground in the
 * close-up is a landing to judge, any other contact a crash.
 */
const flightEvent = (probes: Probes, camera: Camera, flewOff: boolean): FlightEvent => {
  if (flewOff) return 'flewOff';
  if (camera.view === 'minor' && isTouchingDown(probes)) return 'touchdown';
  return hitsSurface(probes) ? 'crash' : 'flying';
};

/**
 * The SELECT button in flight [P TYPE]: the next mission, and the module stops any COMMAND spin.
 */
export const changeMission = (state: FlightState, mission: Mission): FlightState => {
  const { lander } = state.flight;
  return {
    ...state,
    mission,
    flight: {
      ...state.flight,
      lander: { ...lander, rotation: rotationAt(landerOrientation(lander)) },
    },
  };
};

/** The abort after the module has moved, then the ABORT button for the next frame [P PLYCHK]. */
const handleAbort = (state: FlightState, abortPressed: boolean, frame: number): FlightState => {
  const empty = isEmpty(state.flight.tank);
  if (empty) return { ...state, abort: 0, thrust: state.abort > 0 ? 0 : state.thrust };
  const aborted = abortFrame(state.flight.lander, state.abort, state.thrust, frame);
  return {
    ...state,
    flight: { ...state.flight, lander: aborted.lander },
    abort: abortPressed ? ABORT_FRAMES : aborted.count,
    thrust: aborted.thrust,
  };
};

/** One frame of a mission. */
export const updateFlight = (
  state: FlightState,
  controls: Controls,
  frame: number,
): { readonly state: FlightState; readonly event: FlightEvent } => {
  const lever = moveLever(state.lever, controls, tuning.leverStep);
  const aborting = state.abort > 0;
  // During an abort the program keeps the thrust it set and ignores the lever [P THRLVL].
  const flown = flyFrame(
    state.flight,
    {
      turn: controls.turn,
      thrust: aborting ? state.thrust : leverThrust(lever),
      steering: !aborting,
    },
    MISSIONS[state.mission],
    state.camera.view,
    frame,
  );
  const { lander } = flown.flight;
  const followed = followLander(state.camera, {
    ...landerPosition(lander),
    vx: lander.vx,
    vy: lander.vy,
    altitude: altitudeOf(landerProbes(lander, state.camera)),
  });
  const moved: FlightState = {
    ...state,
    flight: flown.flight,
    camera: followed.camera,
    lever,
    thrust: flown.thrust,
    frames: state.frames + 1,
  };
  const event = flightEvent(
    landerProbes(lander, followed.camera),
    followed.camera,
    followed.flewOff,
  );
  return { state: event === 'flying' ? handleAbort(moved, controls.abort, frame) : moved, event };
};
