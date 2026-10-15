/*
 * The data the flight programs work on: the 12 flight slots, the objects they move, the drift
 * of the bombs and the events for the rest of the game, with the helpers that change them.
 */
import type { FlightSlot } from './flight-slot';
import type { Formation } from './formation';
import { updateObject, type GameObject, type Objects } from './objects';

/** What the flight programs read about the rest of the game in this frame. */
export interface FlightInputs {
  /** Frame counter: odd and even frames use different speeds. */
  readonly frame: number;
  /** Sprite x of the fighter, 0 when it is not on screen. */
  readonly fighterX: number;
  /** Few aliens left: they attack nonstop (`b_92A0[$0A]`). */
  readonly continuousBombing: boolean;
  /** A rescued fighter is spinning down to dock (task `f_2000`). */
  readonly rescueRunning: boolean;
  /** Stage parameters 8 and 9: harder attack paths from stage 8 on. */
  readonly harderEntries: boolean;
  readonly harderAttacks: boolean;
  /** Bits allowing a diving alien to drop bombs (`b_92C0[8]`) and frames between tries. */
  readonly bombEnableBits: number;
  readonly bombInterval: number;
  /** The fighter can be bombed: it can fire and is not being captured. */
  readonly bombsAllowed: boolean;
  readonly formation: Formation;
  /** Sprite code and palette a bonus bee takes back when it returns home (`_b_bbee_clr_a`). */
  readonly bonusBeeLook: number;
}

/** Something a flight program asks the rest of the game to do. */
export type FlightEvent =
  | { readonly kind: 'diveSound' }
  | { readonly kind: 'captureDive'; readonly slot: number; readonly targetX: number }
  | { readonly kind: 'bonusBeeHome' };

/** A bomb's horizontal drift: a rate and an accumulator (`b_92B0`). */
export interface BombDrift {
  readonly rate: number;
  readonly accumulator: number;
}

/** Everything the flight runner reads and changes. */
export interface FlightWorld {
  readonly slots: readonly (FlightSlot | undefined)[];
  readonly objects: Objects;
  /** Drift of the 8 bombs, in the order of their objects. */
  readonly bombDrift: readonly BombDrift[];
  readonly events: readonly FlightEvent[];
}

/** Number of flight slots: at most 12 aliens fly at once. */
export const SLOT_COUNT = 12;

/** The game with slot `index` replaced (or emptied with `undefined`). */
export const setSlot = (
  world: FlightWorld,
  index: number,
  slot: FlightSlot | undefined,
): FlightWorld => ({
  ...world,
  slots: world.slots.map((current, i) => (i === index ? slot : current)),
});

/** The game with object `id` changed. */
export const changeObject = (
  world: FlightWorld,
  id: number,
  change: (object: GameObject) => GameObject,
): FlightWorld => ({ ...world, objects: updateObject(world.objects, id, change) });

/** The game with one more event. */
export const emit = (world: FlightWorld, event: FlightEvent): FlightWorld => ({
  ...world,
  events: [...world.events, event],
});
