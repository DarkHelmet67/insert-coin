import { FUEL_FACTOR, type MissionRules } from './missions';
import { THRUST_TABLE, type ThrustLevel } from './thrust';

/**
 * The fuel tank [P GAS, BURN, GIVCRD]. The program counts fuel in decimal: four digits of units
 * and two of hundredths. The remake counts hundredths in a plain integer. See
 * docs/meccaniche-originali.md, section 4.
 */

/** Hundredths of fuel unit in one unit. */
export const HUNDREDTHS = 100;

/** The tank holds at most 9999 units: more coins add nothing [P GIVCRD]. */
export const MAX_FUEL = 9999 * HUNDREDTHS;

/** The fuel tank and what the player has burned in this mission. */
export interface Tank {
  /** Fuel left, in hundredths of a unit. */
  readonly fuel: number;
  /** Fuel burned since the mission started, in hundredths [P FLUSE]. */
  readonly used: number;
}

/** A full tank of `units` units, nothing burned yet. */
export const tankWith = (units: number): Tank => ({
  fuel: Math.min(MAX_FUEL, units * HUNDREDTHS),
  used: 0,
});

/** The whole units the instruments show. */
export const fuelUnits = (tank: Tank): number => Math.floor(tank.fuel / HUNDREDTHS);

/** Whether the tank is empty: less than one whole unit counts as empty [P GAS 10$]. */
export const isEmpty = (tank: Tank): boolean => tank.fuel < HUNDREDTHS;

/**
 * Burns `amount` hundredths [P GAS]. When the tank would drop below one unit it is emptied: that
 * is the moment the player loses the right to thrust and turn.
 */
export const burnFuel = (tank: Tank, amount: number): Tank => {
  const left = tank.fuel - amount;
  return { fuel: left < HUNDREDTHS ? 0 : left, used: tank.used + amount };
};

/** Adds `units` units, up to the maximum: a coin, or the bonus of a good landing [P GIVCRD]. */
export const addFuel = (tank: Tank, units: number): Tank => ({
  ...tank,
  fuel: Math.min(MAX_FUEL, tank.fuel + units * HUNDREDTHS),
});

/**
 * Hundredths burned by the engine in one frame [P BURN]: the acceleration of the thrust level
 * times the fuel factor, / 256. Full lever burns 23 hundredths a frame (9.6 units a second),
 * ABORT 2.17 units a frame, with the normal factor even in PRIME.
 */
export const engineBurn = (thrust: ThrustLevel, rules: MissionRules): number => {
  const power = THRUST_TABLE[thrust] ?? 0;
  const factor = power >= 0x80 ? FUEL_FACTOR : rules.fuelFactor;
  return (power * factor) >> 8;
};
