import type { Orientation } from './module-view';
import type { RotationMode } from './missions';

/**
 * Turning the module with the two rotate buttons [P ROTSHP, ROT.NI, ROTCHK]. See
 * docs/meccaniche-originali.md, section 3.
 *
 * The program keeps a finer counter than the 32 orientations, `ROT` (16 bits): its top byte is
 * four times the orientation, so a held button turns the module one step every 4 frames.
 * COMMAND adds a spin (`SHPINE`) that keeps turning the module after the button is released.
 */

/** The rotation of the module. */
export interface Rotation {
  /** `ROT`: 16 bits, the orientation is bits 10 to 14. */
  readonly counter: number;
  /** `SHPINE`: added to the counter every frame in COMMAND, signed. */
  readonly spin: number;
  /** Whether the spin was not zero the last frame no button was held [P INERTIA+1]. */
  readonly wasSpinning: boolean;
}

/** -1 for the right button, 1 for the left one, 0 for none or both [P ROTCHK]. */
export type Turn = -1 | 0 | 1;

/** Fuel burned by one frame of turning, in hundredths of a unit [P ROT.GAS]. */
export const TURN_FUEL = 6;

/** Spin added by one frame of button in COMMAND [P ROTSHP]. */
export const SPIN_STEP = 0x10;
/** Fastest spin to the left, and to the right [P ROTSHP]. */
export const MAX_SPIN = { left: 0x03e0, right: -0x0400 } as const;
/** A spin this small, with no button held, stops the module or sets the slowest spin. */
export const SPIN_WINDOW = 0x40;
/** The slowest spin the module keeps once the button is released [P ROTSHP]. */
export const MIN_SPIN = 0x50;

/** TRAINING limits the counter to 0..0x40: from lying on the right to lying on the left. */
const TRAINING_TOP = 0x40;

/** The rotation of a module drawn at `orientation`, still [P TYPLP]. */
export const rotationAt = (orientation: Orientation): Rotation => ({
  counter: (orientation << 10) & 0xffff,
  spin: 0,
  wasSpinning: false,
});

/** The orientation the rotation draws [P ROTSHP: SHIP = ROT+1 / 4]. */
export const rotationOrientation = (rotation: Rotation): Orientation =>
  (rotation.counter >> 10) & 0x1f;

/** The outcome of one frame of turning. */
export interface TurnResult {
  readonly rotation: Rotation;
  /** Fuel burned, in hundredths of a unit. */
  readonly fuel: number;
}

/**
 * TRAINING, CADET and PRIME [P ROT.NI]: each frame of button moves the top byte of the counter
 * by one and costs {@link TURN_FUEL}. TRAINING stops at the two sides, for free.
 */
const turnWithoutInertia = (rotation: Rotation, turn: Turn, limited: boolean): TurnResult => {
  if (turn === 0) return { rotation, fuel: 0 };
  const top = ((rotation.counter >> 8) + turn) & 0xff;
  if (limited && (top === 0xff || top === TRAINING_TOP + 1)) {
    const side = top === 0xff ? 0 : TRAINING_TOP;
    return { rotation: { ...rotation, counter: side << 8 }, fuel: 0 };
  }
  return {
    rotation: { ...rotation, counter: (top << 8) | (rotation.counter & 0xff) },
    fuel: TURN_FUEL,
  };
};

/** The spin after one frame of button in COMMAND, within the two limits [P ROTSHP 15$-25$]. */
export const pushSpin = (spin: number, turn: Turn): number => {
  const pushed = spin + turn * SPIN_STEP;
  if (pushed > MAX_SPIN.left) return pushed >= 0x400 ? MAX_SPIN.left : pushed;
  return Math.max(MAX_SPIN.right, pushed);
};

/**
 * The spin with no button held [P ROTSHP 30$]. A small spin stops the module if it was spinning
 * the last time no button was held; otherwise (a tap from still) it becomes the slowest spin, so
 * one tap always sets the module turning and a tap the other way stops it.
 */
export const settleSpin = (spin: number, wasSpinning: boolean): number => {
  if (Math.abs(spin) > SPIN_WINDOW) return spin;
  if (wasSpinning || spin === 0) return 0;
  return spin > 0 ? MIN_SPIN : -MIN_SPIN;
};

/** COMMAND: the counter follows the spin, the buttons change the spin [P ROTSHP]. */
const turnWithInertia = (rotation: Rotation, turn: Turn): TurnResult => {
  const counter = (rotation.counter + rotation.spin) & 0xffff;
  if (turn !== 0) {
    return {
      rotation: { ...rotation, counter, spin: pushSpin(rotation.spin, turn) },
      fuel: TURN_FUEL,
    };
  }
  const spin = settleSpin(rotation.spin, rotation.wasSpinning);
  return { rotation: { counter, spin, wasSpinning: spin !== 0 }, fuel: 0 };
};

/**
 * One frame of the rotate buttons in the given mode. `canTurn` is false without fuel: the
 * buttons do nothing, though a COMMAND module keeps spinning [P ROTSHP: ROTATE ONLY W/ CREDIT].
 */
export const turnModule = (
  rotation: Rotation,
  turn: Turn,
  mode: RotationMode,
  canTurn: boolean,
): TurnResult => {
  const input = canTurn ? turn : 0;
  if (mode === 'inertia') {
    if (!canTurn) {
      return {
        rotation: { ...rotation, counter: (rotation.counter + rotation.spin) & 0xffff },
        fuel: 0,
      };
    }
    return turnWithInertia(rotation, input);
  }
  return turnWithoutInertia(rotation, input, mode === 'limited');
};
