import { clipLines, DVG_CLIP, type BeamLine } from '@arcade/vector';
import { projection, toScreen } from './camera';
import { altitudeOf } from './collision';
import { explosionLines } from './explosion';
import { moduleLines } from './flame';
import { fuelUnits, isEmpty, type Tank } from './fuel';
import { currentTank, wreckPosition, type GameState, type Landed } from './game';
import { hudLines } from './hud';
import { landerOrientation, landerPosition } from './lander';
import {
  attractLines,
  fuelLostLines,
  fuelStatusLines,
  outcomeLines,
  readyLines,
  tanksDestroyedLines,
} from './messages';
import { landerProbes, type FlightState } from './play';
import { chosenSiteLines } from './sites';
import { starLines } from './stars';
import { surfaceLines } from './surface';
import { tuning } from './tuning.config';

/**
 * What the screen shows in each mode, as lists of beam lines [P MAINLP: MESDATA, SCAPE, STARS,
 * MODULE, FLAME, SITES, STATUS, DSPMOT, DSPATTR, DSPRTP]. Pure: drawing happens in main.ts.
 */

/** Seconds on the mission clock: the program counts real seconds [P LUNINT GMTIME]. */
export const missionSeconds = (frames: number): number =>
  Math.floor(frames / tuning.framesPerSecond);

/** Fuel below this many units sets off the warning [P STATUS: FUEL+2 = 0]. */
export const LOW_FUEL = 100;

/** The module, small in the whole view and large in the close-up [P MODULE, FLAME]. */
const landerLines = (flight: FlightState, frame: number, flame: boolean): readonly BeamLine[] => {
  const { lander } = flight.flight;
  const { x, y } = landerPosition(lander);
  const screen = toScreen(flight.camera, x, y);
  return moduleLines({
    x: screen.x,
    y: screen.y,
    size: flight.camera.view === 'major' ? 'small' : 'large',
    orientation: landerOrientation(lander),
    thrust: flame ? flight.thrust : 0,
    frame,
  });
};

/** Surface and stars; `playing` adds the high starfield. */
const sceneryLines = (flight: FlightState, playing: boolean): readonly BeamLine[] => [
  ...surfaceLines(projection(flight.camera)),
  ...starLines(flight.camera, playing),
];

/** The instruments for a flight; `altitude` is false after the landing, when it reads 0. */
const instruments = (
  state: GameState,
  flight: FlightState,
  altitude: boolean,
): readonly BeamLine[] => {
  const { lander } = flight.flight;
  return hudLines({
    score: state.score,
    seconds: missionSeconds(flight.frames),
    fuel: fuelUnits(currentTank(state)),
    altitude: altitude ? Math.floor(altitudeOf(landerProbes(lander, flight.camera))) : 0,
    vx: lander.vx,
    vy: lander.vy,
  });
};

/** Messages about the fuel during a flight [P STATUS]. */
const fuelMessages = (state: GameState, tank: Tank): readonly BeamLine[] => {
  if (state.fuelLoss !== null) return fuelLostLines(state.fuelLoss.units);
  if (isEmpty(tank)) return fuelStatusLines('out');
  return fuelUnits(tank) < LOW_FUEL && (state.frame & 0x10) === 0 ? fuelStatusLines('low') : [];
};

/** The landing or crash sequence: no sites and no flame; a crash replaces the module [P BOOM]. */
const landedLines = (state: GameState, landed: Landed): readonly BeamLine[] => {
  const wreck = wreckPosition(landed);
  const module =
    landed.outcome === 'crash'
      ? explosionLines(landed.explosion, landed.step, wreck.x, wreck.y)
      : landerLines(landed.flight, state.frame, false);
  return [
    ...clipLines([...sceneryLines(landed.flight, true), ...module], DVG_CLIP),
    ...instruments(state, landed.flight, false),
    ...(state.fuelLoss === null
      ? []
      : [...tanksDestroyedLines, ...fuelLostLines(state.fuelLoss.units)]),
    ...outcomeLines(landed.outcome, landed.verdict, landed.points),
  ];
};

/**
 * Everything on the screen. The scenery is clipped to the 1024 x 1024 square of the vector
 * generator, as the hardware does [H avgdvg.cpp].
 */
export const gameLines = (state: GameState): readonly BeamLine[] => {
  const { mode, frame } = state;
  switch (mode.kind) {
    case 'ready':
      return readyLines(fuelUnits(state.tank));
    case 'attract':
      return [
        ...clipLines(
          [...sceneryLines(mode.flight, false), ...landerLines(mode.flight, frame, false)],
          DVG_CLIP,
        ),
        ...instruments(state, mode.flight, true),
        ...attractLines(tuning.fuelPerCoin, (frame & 0x20) !== 0),
      ];
    case 'flying':
      return [
        ...clipLines(
          [
            ...sceneryLines(mode.flight, true),
            ...chosenSiteLines(mode.flight.sites, mode.flight.camera, frame),
            ...landerLines(mode.flight, frame, true),
          ],
          DVG_CLIP,
        ),
        ...instruments(state, mode.flight, true),
        ...fuelMessages(state, mode.flight.flight.tank),
      ];
    case 'landed':
      return landedLines(state, mode);
  }
};
