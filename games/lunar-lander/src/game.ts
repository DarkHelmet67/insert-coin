import { followLander, toScreen } from './camera';
import { altitudeOf, hitsSurface, isTouchingDown } from './collision';
import { moveLever, noControls, type Controls } from './controls';
import { explosionFor, type Explosion } from './explosion';
import { addFuel, burnFuel, HUNDREDTHS, isEmpty, tankWith, type Tank } from './fuel';
import {
  fuelPenalty,
  GOOD_LANDING_FUEL,
  judgeLanding,
  landingPoints,
  type Outcome,
} from './landing';
import { landerOrientation, landerPosition, moveLander, type Lander } from './lander';
import { MISSIONS, nextMission, type Mission } from './missions';
import { changeMission, landerProbes, startFlight, updateFlight, type FlightState } from './play';
import { rotationAt } from './rotation';
import { multiplierAt } from './sites';
import { tuning } from './tuning.config';

/**
 * The whole cabinet as one pure state machine [P DOGAME, PLYCHK, MOTCHK]: attract, the screen
 * after a coin, the flight, and the landing or crash sequence. `updateGame` is the only entry
 * point; it never touches the browser.
 */

/** The landing or crash sequence [P MOTCHK, DSPMOT, BOOM]. */
export interface Landed {
  readonly kind: 'landed';
  readonly flight: FlightState;
  readonly outcome: Outcome;
  /** Step of the sequence, 1 to 127, one every two frames [P INDEX]. */
  readonly step: number;
  readonly points: number;
  /** Which of the four verdicts is written, 0 to 3 [P RNDOM]. */
  readonly verdict: number;
  readonly explosion: Explosion;
  /** A hard landing bounces once before it settles [P M.CLFL bit 6]. */
  readonly bouncing: boolean;
}

/** What the cabinet is doing. */
export type Mode =
  /** No fuel: the module drops by itself, waiting for a coin [P ATRINIT]. */
  | { readonly kind: 'attract'; readonly flight: FlightState }
  /** Fuel bought: SELECT OPTION, PUSH START [P DSPRTP]. */
  | { readonly kind: 'ready' }
  /** A mission; `emptyFrames` counts the frames since the tank ran dry [P TIMER]. */
  | { readonly kind: 'flying'; readonly flight: FlightState; readonly emptyFrames: number }
  | Landed;

/** The "fuel lost" message, shown for a while after a crash or a flight into space [P MSCNT1]. */
export interface FuelLoss {
  readonly units: number;
  readonly frames: number;
}

/** The state of the cabinet. */
export interface GameState {
  readonly mode: Mode;
  /** Frames since power-on [P FRAME]: flashing texts, flame flicker, friction. */
  readonly frame: number;
  /** The fuel bought and not yet burned, between missions. */
  readonly tank: Tank;
  readonly mission: Mission;
  /** The thrust lever, 0 to 255: a physical lever, it stays where it is between missions. */
  readonly lever: number;
  readonly score: number;
  /** Best score in this browser [N: the cabinet kept no record]. */
  readonly hiScore: number;
  readonly fuelLoss: FuelLoss | null;
  /** Start value of the 4 ms interrupt counter, the program's only source of chance [P INTCNT]. */
  readonly seed: number;
}

/** Frames the "fuel lost" message stays on screen [P DEDCNT]. */
export const FUEL_LOSS_FRAMES = 127;
/** Seconds the game waits after the tank runs dry before giving up [P PLYCHK: TIMER >= 5]. */
export const EMPTY_TANK_SECONDS = 5;
/** Last step of the landing or crash sequence [P MOTCHK: INDEX up to 127]. */
export const LAST_STEP = 127;
/** Bounce of a hard landing: upward speed and stronger gravity [P M.HRDY, M.HRDG]. */
export const HARD_BOUNCE = { vy: 10 << 8, gravity: 65 } as const;

/**
 * The interrupt counter in frame `frame`: it counts every 4 ms, 6 times a frame, so the moment a
 * player lands or presses START decides the "random" choices [P INTCNT].
 */
export const interruptCount = (state: GameState): number => (state.seed + state.frame * 6) & 0xff;

/**
 * The attract module [P ATRINIT]: upright at the start position, falling with no speed but a
 * random push to the right, the high part of the speed being the interrupt counter.
 */
const attractFlight = (random: number): FlightState => {
  const flight = startFlight('cadet', tankWith(0), random);
  return {
    ...flight,
    flight: {
      ...flight.flight,
      lander: { ...flight.flight.lander, vx: random << 8, vy: 0, rotation: rotationAt(8) },
    },
  };
};

/** The cabinet at power-on: attract, no fuel. */
export const createGame = (seed: number, hiScore: number): GameState => ({
  mode: { kind: 'attract', flight: attractFlight(seed & 0xff) },
  frame: 0,
  tank: tankWith(0),
  mission: 'training',
  lever: 0,
  score: 0,
  hiScore,
  fuelLoss: null,
  seed: seed & 0xff,
});

/** The fuel in the tank right now: the flying module's, or the one waiting for a mission. */
export const currentTank = (state: GameState): Tank =>
  state.mode.kind === 'flying' || state.mode.kind === 'landed'
    ? state.mode.flight.flight.tank
    : state.tank;

/** A coin: fuel for the whole game, even in flight [P GIVCRD]. From attract it leads to START. */
const insertCoin = (state: GameState): GameState => {
  const tank = addFuel(currentTank(state), tuning.fuelPerCoin);
  const { mode } = state;
  if (mode.kind === 'flying' || mode.kind === 'landed') {
    return {
      ...state,
      mode: { ...mode, flight: { ...mode.flight, flight: { ...mode.flight.flight, tank } } },
    };
  }
  // A new game: TRAINING, score cleared [P DOGAME 10$].
  return mode.kind === 'attract'
    ? { ...state, tank, mode: { kind: 'ready' }, mission: 'training', score: 0, fuelLoss: null }
    : { ...state, tank };
};

/** The SELECT button: the next mission, at any moment but in attract [P TYPE]. */
const selectMission = (state: GameState): GameState => {
  const mission = nextMission(state.mission);
  const { mode } = state;
  if (mode.kind === 'flying') {
    return { ...state, mission, mode: { ...mode, flight: changeMission(mode.flight, mission) } };
  }
  return mode.kind === 'attract' ? state : { ...state, mission };
};

/** A new mission with what is left in the tank [P PLYSTRT]. */
const startMission = (state: GameState, tank: Tank): GameState => ({
  ...state,
  tank,
  mode: {
    kind: 'flying',
    flight: startFlight(state.mission, tank, interruptCount(state)),
    emptyFrames: 0,
  },
});

/** The game is over: back to attract, the record updated [P START; N]. */
const gameOver = (state: GameState): GameState => ({
  ...state,
  tank: tankWith(0),
  hiScore: Math.max(state.hiScore, state.score),
  mode: { kind: 'attract', flight: attractFlight(interruptCount(state)) },
});

/** Burns the fuel penalty of a crash or a flight into space, and shows it [P DEDCTA]. */
const payPenalty = (
  state: GameState,
  flight: FlightState,
): { readonly tank: Tank; readonly loss: FuelLoss | null } => {
  const seconds = Math.floor(flight.frames / tuning.framesPerSecond);
  const units = fuelPenalty(seconds, flight.flight.tank);
  if (units === 0) return { tank: flight.flight.tank, loss: state.fuelLoss };
  const before = flight.flight.tank.fuel;
  const tank = burnFuel(flight.flight.tank, units * HUNDREDTHS);
  return {
    tank,
    loss: { units: Math.floor((before - tank.fuel) / HUNDREDTHS), frames: FUEL_LOSS_FRAMES },
  };
};

/**
 * The module has met the surface [P PLYCHK 10$]: points, bonus fuel for a good landing, penalty
 * for a crash, speeds cleared, the sequence starts.
 */
const touchDown = (state: GameState, flight: FlightState, outcome: Outcome): GameState => {
  const { lander } = flight.flight;
  const random = interruptCount(state);
  const points = landingPoints(outcome, multiplierAt(landerPosition(lander).x, flight.sites));
  const paid =
    outcome === 'crash'
      ? payPenalty(state, flight)
      : { tank: flight.flight.tank, loss: state.fuelLoss };
  const tank = outcome === 'good' ? addFuel(paid.tank, GOOD_LANDING_FUEL) : paid.tank;
  const stopped: Lander = { ...lander, vx: 0, vy: outcome === 'hard' ? HARD_BOUNCE.vy : 0 };
  return {
    ...state,
    score: state.score + points,
    fuelLoss: paid.loss,
    mode: {
      kind: 'landed',
      flight: { ...flight, thrust: 0, abort: 0, flight: { lander: stopped, tank } },
      outcome,
      step: 1,
      points,
      verdict: (random >> 2) & 3,
      explosion: explosionFor(lander.vx, lander.vy, random),
      bouncing: outcome === 'hard',
    },
  };
};

/** The module flew off into space: fuel penalty, and the mission starts again [P SCAPMJR 27$]. */
const flewOff = (state: GameState, flight: FlightState): GameState => {
  const paid = payPenalty(state, flight);
  return { ...startMission(state, paid.tank), fuelLoss: paid.loss };
};

/** One frame of flight. */
const updateFlying = (
  state: GameState,
  flight: FlightState,
  emptyFrames: number,
  controls: Controls,
): GameState => {
  const { state: next, event } = updateFlight(flight, controls, state.frame, state.lever);
  if (event === 'flewOff') return flewOff(state, next);
  if (event === 'crash') return touchDown(state, next, 'crash');
  if (event === 'touchdown') {
    const { lander } = next.flight;
    return touchDown(state, next, judgeLanding(landerOrientation(lander), lander.vx, lander.vy));
  }
  const empty = isEmpty(next.flight.tank) ? emptyFrames + 1 : 0;
  if (empty >= EMPTY_TANK_SECONDS * tuning.framesPerSecond) return gameOver(state);
  return { ...state, mode: { kind: 'flying', flight: next, emptyFrames: empty } };
};

/**
 * The bounce of a hard landing [P MOTCHK]: the module jumps up under a stronger gravity and
 * settles where it falls back on the surface.
 */
const bounce = (landed: Landed): Landed => {
  const { flight } = landed;
  const { lander } = flight.flight;
  const probes = landerProbes(lander, flight.camera);
  if (lander.vy < 0 && (isTouchingDown(probes) || hitsSurface(probes))) {
    return { ...landed, bouncing: false };
  }
  const rules = { ...MISSIONS.cadet, gravity: HARD_BOUNCE.gravity };
  const moved = moveLander(lander, { x: 0, y: 0 }, rules, flight.camera.view);
  const camera = followLander(flight.camera, {
    ...landerPosition(moved),
    vx: 0,
    vy: moved.vy,
    altitude: altitudeOf(landerProbes(moved, flight.camera)),
  }).camera;
  return { ...landed, flight: { ...flight, camera, flight: { ...flight.flight, lander: moved } } };
};

/** One frame of the landing or crash sequence; at its end, the next mission or game over. */
const updateLanded = (state: GameState, landed: Landed): GameState => {
  const moved = landed.bouncing ? bounce(landed) : landed;
  const step = state.frame % 2 === 0 ? moved.step + 1 : moved.step;
  if (step > LAST_STEP) {
    const { tank } = moved.flight.flight;
    return isEmpty(tank) ? gameOver(state) : startMission(state, tank);
  }
  return { ...state, mode: { ...moved, step } };
};

/** One frame of attract: the module falls and starts again on contact [P ATRINIT]. */
const updateAttract = (state: GameState, flight: FlightState): GameState => {
  const { state: next, event } = updateFlight(flight, noControls, state.frame, 0);
  return {
    ...state,
    mode: {
      kind: 'attract',
      flight: event === 'flying' ? next : attractFlight(interruptCount(state)),
    },
  };
};

/** The mode after one frame, with the controls already applied to coins and SELECT. */
const updateMode = (state: GameState, controls: Controls): GameState => {
  const { mode } = state;
  switch (mode.kind) {
    case 'attract':
      return updateAttract(state, mode.flight);
    case 'ready':
      return controls.start ? startMission(state, state.tank) : state;
    case 'flying':
      return updateFlying(state, mode.flight, mode.emptyFrames, controls);
    case 'landed':
      return updateLanded(state, mode);
  }
};

/** The fuel-loss message counts down [P STATUS, DSPMOT]. */
const tickFuelLoss = (loss: FuelLoss | null): FuelLoss | null =>
  loss === null || loss.frames <= 1 ? null : { ...loss, frames: loss.frames - 1 };

/**
 * One frame of the cabinet. In attract, START or a coin key both drop a coin [N: the keyboard has
 * no coin slot]; elsewhere START starts and the coin key adds fuel.
 */
export const updateGame = (state: GameState, controls: Controls): GameState => {
  const coin = controls.coin || (state.mode.kind === 'attract' && controls.start);
  const paid = coin ? insertCoin(state) : state;
  const selected = controls.select ? selectMission(paid) : paid;
  const startIgnored =
    coin && state.mode.kind === 'attract' ? { ...controls, start: false } : controls;
  const lever = moveLever(state.lever, controls, tuning.leverStep);
  const next = updateMode({ ...selected, lever }, startIgnored);
  return { ...next, frame: next.frame + 1, fuelLoss: tickFuelLoss(next.fuelLoss) };
};

/** Where the wreck is on the screen, for the explosion. */
export const wreckPosition = (landed: Landed): { x: number; y: number } => {
  const { x, y } = landerPosition(landed.flight.flight.lander);
  return toScreen(landed.flight.camera, x, y);
};
