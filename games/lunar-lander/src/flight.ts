import { burnFuel, engineBurn, isEmpty, type Tank } from './fuel';
import {
  isFrictionFrame,
  landerOrientation,
  moveLander,
  slowDown,
  type Lander,
  type View,
} from './lander';
import type { MissionRules } from './missions';
import { turnModule, type Turn } from './rotation';
import { enginePush, type ThrustLevel } from './thrust';

/**
 * One frame of play for the module and its tank, in the order of the program's main loop
 * [P MAINLP]: friction (TRAINING), thrust from the lever, push for the current orientation,
 * rotation, fuel, movement.
 */

/** The module and its tank. */
export interface Flight {
  readonly lander: Lander;
  readonly tank: Tank;
}

/** What the player asks of the module in one frame. */
export interface Commands {
  readonly turn: Turn;
  /** Thrust level, from the lever (0-15) or ABORT (16). */
  readonly thrust: ThrustLevel;
  /** False during an abort: the program skips the rotation altogether [P ROTSHP]. */
  readonly steering: boolean;
}

/** What the frame did, for the flame and the sound. */
export interface FlightFrame {
  readonly flight: Flight;
  /** The thrust actually applied: 0 with an empty tank [P THRLVL]. */
  readonly thrust: ThrustLevel;
}

/**
 * One frame of flight. With an empty tank the engine and the rotate buttons stop working
 * [P THRLVL, ROTSHP: only with credit], but gravity does not.
 */
export const flyFrame = (
  flight: Flight,
  commands: Commands,
  rules: MissionRules,
  view: View,
  frame: number,
): FlightFrame => {
  const slowed = rules.friction && isFrictionFrame(frame) ? slowDown(flight.lander) : flight.lander;
  const hasFuel = !isEmpty(flight.tank);
  const thrust = hasFuel ? commands.thrust : 0;
  // The push uses the orientation before this frame's turn, as the program does.
  const push = enginePush(landerOrientation(slowed), thrust, rules);
  const turned = commands.steering
    ? turnModule(slowed.rotation, commands.turn, rules.rotation, hasFuel)
    : { rotation: slowed.rotation, fuel: 0 };
  const afterTurn = turned.fuel > 0 ? burnFuel(flight.tank, turned.fuel) : flight.tank;
  const burn = engineBurn(thrust, rules);
  const tank = burn > 0 ? burnFuel(afterTurn, burn) : afterTurn;
  const lander = moveLander({ ...slowed, rotation: turned.rotation }, push, rules, view);
  return { flight: { lander, tank }, thrust };
};
