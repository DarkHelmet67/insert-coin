import { clipLines, DVG_CLIP, type BeamLine } from '@arcade/vector';
import { projection, toScreen } from './camera';
import { altitudeOf } from './collision';
import { moduleLines } from './flame';
import { fuelUnits } from './fuel';
import { hudLines } from './hud';
import { landerOrientation, landerPosition } from './lander';
import { landerProbes, type FlightState } from './play';
import { chosenSiteLines } from './sites';
import { starLines } from './stars';
import { surfaceLines } from './surface';
import { tuning } from './tuning.config';

/** Seconds on the mission clock: the program counts real seconds [P LUNINT GMTIME]. */
export const missionSeconds = (frames: number): number =>
  Math.floor(frames / tuning.framesPerSecond);

/** The module, small in the whole view and large in the close-up [P MODULE]. */
const landerLines = (state: FlightState, frame: number): readonly BeamLine[] => {
  const { lander } = state.flight;
  const { x, y } = landerPosition(lander);
  const screen = toScreen(state.camera, x, y);
  return moduleLines({
    x: screen.x,
    y: screen.y,
    size: state.camera.view === 'major' ? 'small' : 'large',
    orientation: landerOrientation(lander),
    thrust: state.thrust,
    frame,
  });
};

/**
 * Everything on the screen during a mission: surface, stars, sites, module and instruments. The
 * scenery is clipped to the 1024 x 1024 square of the vector generator, as the hardware does
 * [H avgdvg.cpp].
 */
export const flightLines = (state: FlightState, frame: number): readonly BeamLine[] => {
  const { lander, tank } = state.flight;
  const scenery = [
    ...surfaceLines(projection(state.camera)),
    ...starLines(state.camera, true),
    ...chosenSiteLines(state.sites, state.camera, frame),
    ...landerLines(state, frame),
  ];
  return [
    ...clipLines(scenery, DVG_CLIP),
    ...hudLines({
      score: 0,
      seconds: missionSeconds(state.frames),
      fuel: fuelUnits(tank),
      altitude: Math.floor(altitudeOf(landerProbes(lander, state.camera))),
      vx: lander.vx,
      vy: lander.vy,
    }),
  ];
};
