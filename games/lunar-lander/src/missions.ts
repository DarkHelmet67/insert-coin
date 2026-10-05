import { tuning } from './tuning.config';
import { scaleSpeed } from './velocity';

/**
 * The four missions of the cabinet, chosen with the SELECT button. They differ in gravity,
 * engine power, fuel use and rotation [P GRAVT, ACCEL, BURN, ROTSHP, FRICTN]. See
 * docs/meccaniche-originali.md, section 8.
 */

/** The missions, in the order the SELECT button walks through them [P TYPE, MODLMP]. */
export type Mission = 'training' | 'cadet' | 'prime' | 'command';

/** How a mission turns the module. */
export type RotationMode = 'limited' | 'free' | 'inertia';

/** What changes from one mission to another. */
export interface MissionRules {
  /** Name written on the panel lamp. */
  readonly label: string;
  /** Subtracted from the vertical speed every frame [P GRAVT]. */
  readonly gravity: number;
  /** PRIME has engines 1.5 times stronger [P ACCEL]. */
  readonly strongEngine: boolean;
  /** Fuel factor: fuel burned = thrust x factor / 256 hundredths per frame [P BURN]. */
  readonly fuelFactor: number;
  /** TRAINING cannot turn upside down, COMMAND turns with inertia [P ROT.NI, ROTSHP]. */
  readonly rotation: RotationMode;
  /** Only TRAINING slows the module down, as if there were air [P FRICTN]. */
  readonly friction: boolean;
}

/** A gravity of the program [P GRAVT], times the multiplier of `tuning.config.ts` [N]. */
const gravityOf = (programGravity: number): number =>
  scaleSpeed(programGravity, tuning.physics.gravityScale);

/** Fuel factor of every mission but PRIME [P FUELFAC]. */
export const FUEL_FACTOR = 0xda;

/** The four missions, as the program stores them. */
export const MISSIONS: Readonly<Record<Mission, MissionRules>> = {
  training: {
    label: 'TRAINING',
    gravity: gravityOf(0x11),
    strongEngine: false,
    fuelFactor: FUEL_FACTOR,
    rotation: 'limited',
    friction: true,
  },
  cadet: {
    label: 'CADET',
    gravity: gravityOf(0x11),
    strongEngine: false,
    fuelFactor: FUEL_FACTOR,
    rotation: 'free',
    friction: false,
  },
  prime: {
    label: 'PRIME',
    gravity: gravityOf(0x22),
    strongEngine: true,
    fuelFactor: 0x90,
    rotation: 'free',
    friction: false,
  },
  command: {
    label: 'COMMAND',
    gravity: gravityOf(0x11),
    strongEngine: false,
    fuelFactor: FUEL_FACTOR,
    rotation: 'inertia',
    friction: false,
  },
};

/** The missions in SELECT order. */
export const MISSION_ORDER: readonly Mission[] = ['training', 'cadet', 'prime', 'command'];

/** The mission after `mission`, as one press of SELECT gives it. */
export const nextMission = (mission: Mission): Mission =>
  MISSION_ORDER[(MISSION_ORDER.indexOf(mission) + 1) % MISSION_ORDER.length] ?? 'training';
