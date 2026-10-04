import { followLander, startingCamera, type Camera } from './camera';
import { altitudeOf, hitsSurface, isTouchingDown, probesAt, type Probes } from './collision';
import { moveLever, type Controls } from './controls';
import { flyFrame, type Flight } from './flight';
import { tankWith } from './fuel';
import { landerOrientation, landerPosition, startingLander, type Lander } from './lander';
import { MISSIONS, type Mission } from './missions';
import { chooseSites } from './sites';
import { leverThrust, type ThrustLevel } from './thrust';
import { tuning } from './tuning.config';

/**
 * A mission in flight: the module, its tank, the camera and the chosen sites, one frame at a
 * time [P MAINLP]. Pure: `updateFlight` returns the next state and what happened.
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
  /** The four sites with a bonus [P TABSIT]. */
  readonly sites: readonly number[];
  /** Frames since the mission began: the clock on the instruments. */
  readonly frames: number;
}

/** How a frame of flight ended. */
export type FlightEvent = 'flying' | 'touchdown' | 'crash' | 'flewOff';

/** A new mission [P PLYINIT], with the fuel in `tank` units and the sites from `random`. */
export const startFlight = (mission: Mission, fuel: number, random: number): FlightState => ({
  mission,
  flight: { lander: startingLander(), tank: tankWith(fuel) },
  camera: startingCamera,
  lever: 0,
  thrust: 0,
  sites: chooseSites(random),
  frames: 0,
});

/** The probe points of the module with the current camera. */
export const landerProbes = (lander: Lander, camera: Camera): Probes => {
  const { x, y } = landerPosition(lander);
  return probesAt(x, y, landerOrientation(lander), camera.view);
};

/** The event of a frame, from where the module ended up [P DECODE, SCAPLND]. */
const flightEvent = (probes: Probes, camera: Camera, flewOff: boolean): FlightEvent => {
  if (flewOff) return 'flewOff';
  if (hitsSurface(probes)) return 'crash';
  if (camera.view === 'minor' && isTouchingDown(probes)) return 'touchdown';
  return 'flying';
};

/** The thrust the player asks for: the lever, or ABORT's full power once ABORT starts. */
const requestedThrust = (lever: number): ThrustLevel => leverThrust(lever);

/** One frame of a mission. */
export const updateFlight = (
  state: FlightState,
  controls: Controls,
  frame: number,
): { readonly state: FlightState; readonly event: FlightEvent } => {
  const lever = moveLever(state.lever, controls, tuning.leverStep);
  const flown = flyFrame(
    state.flight,
    { turn: controls.turn, thrust: requestedThrust(lever) },
    MISSIONS[state.mission],
    state.camera.view,
    frame,
  );
  const { lander } = flown.flight;
  const position = landerPosition(lander);
  const followed = followLander(state.camera, {
    ...position,
    vx: lander.vx,
    vy: lander.vy,
    altitude: altitudeOf(landerProbes(lander, state.camera)),
  });
  const next: FlightState = {
    ...state,
    flight: flown.flight,
    camera: followed.camera,
    lever,
    thrust: flown.thrust,
    frames: state.frames + 1,
  };
  return {
    state: next,
    event: flightEvent(landerProbes(lander, followed.camera), followed.camera, followed.flewOff),
  };
};
