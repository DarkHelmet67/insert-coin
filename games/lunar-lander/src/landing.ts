import { HUNDREDTHS, type Tank } from './fuel';
import type { Orientation } from './module-view';

/**
 * The end of a mission [P SCAPLND, POINTS, LNDADR, PLYCHK, DEDUCT]. See
 * docs/meccaniche-originali.md, section 6.
 */

/** How the module met the surface. */
export type Outcome = 'good' | 'hard' | 'crash';

/** Orientations that can land: upright, or one step either side [P SCAPLND: SHIP 7-9]. */
const LANDING_ORIENTATIONS: readonly Orientation[] = [7, 8, 9];

/**
 * The verdict when both feet touch the surface [P SCAPLND]. The program looks at the top byte of
 * each speed: horizontal under 4 (the instrument shows less than 16), vertical under 4 for a good
 * landing and under 8 (less than 32 on the instrument) for a hard one. Anything else, or a
 * module not upright, is a crash.
 */
export const judgeLanding = (orientation: Orientation, vx: number, vy: number): Outcome => {
  if (!LANDING_ORIENTATIONS.includes(orientation) || Math.abs(vx) >> 8 >= 4) return 'crash';
  const fall = Math.abs(vy) >> 8;
  if (fall < 4) return 'good';
  return fall < 8 ? 'hard' : 'crash';
};

/** Points of each outcome, before the site multiplier [P POINTS]. */
export const OUTCOME_POINTS: Readonly<Record<Outcome, number>> = { good: 50, hard: 15, crash: 5 };

/** Points of a landing on a site with `multiplier` (1 outside the sites) [P LNDADR]. */
export const landingPoints = (outcome: Outcome, multiplier: number): number =>
  OUTCOME_POINTS[outcome] * multiplier;

/** Fuel units given back by a good landing [P BNFUEL]. */
export const GOOD_LANDING_FUEL = 50;

/** The minimum burn: 8 units for every second of mission [P FLFACT]. */
export const MIN_BURN_PER_SECOND = 8;

/** The most fuel a crash can cost [P DEDCTA]. */
const MAX_LOSS = 9999;

/**
 * Fuel lost by a crash or by flying off into space [P DEDCTA]: a player who burned less than 8
 * units a second pays the difference, so crashing on purpose to save fuel does not pay.
 */
export const fuelPenalty = (seconds: number, tank: Tank): number =>
  Math.min(
    MAX_LOSS,
    Math.max(0, seconds * MIN_BURN_PER_SECOND - Math.floor(tank.used / HUNDREDTHS)),
  );
