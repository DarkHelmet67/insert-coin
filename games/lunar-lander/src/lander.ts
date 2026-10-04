import type { MissionRules } from './missions';
import type { Orientation } from './module-view';
import { rotationAt, rotationOrientation, type Rotation } from './rotation';
import type { Push } from './thrust';
import { addSpeed, applyFriction, withSignOf } from './velocity';

/**
 * The module in flight: where it is, how fast it goes, how it is turned [P ACCEL, FRICTN].
 * See docs/meccaniche-originali.md, sections 2 and 3.
 *
 * The program keeps the position on the screen and moves the scenery when the module nears an
 * edge; the remake keeps it in the world, the 4096-wide lunar surface, and lets the camera
 * follow ([N], same result). Positions are in 1/4096 of a world unit, so a speed of 4096 moves
 * the module by one unit per frame.
 */

/** Sub-units of position in one world unit: the speed that moves one unit per frame. */
export const POSITION_SCALE = 4096;

/** Which of the two views is on: the whole surface (1:4) or the close-up (1:1). */
export type View = 'major' | 'minor';

/** The module. */
export interface Lander {
  /** Position in the world, in 1/{@link POSITION_SCALE} units; y grows upwards. */
  readonly x: number;
  readonly y: number;
  /** Speeds, in 1/{@link POSITION_SCALE} units per frame. */
  readonly vx: number;
  readonly vy: number;
  readonly rotation: Rotation;
}

/** The module's orientation, 0 to 31 (8 = upright). */
export const landerOrientation = (lander: Lander): Orientation =>
  rotationOrientation(lander.rotation);

/** Position in whole world units. */
export const landerPosition = (lander: Lander): { readonly x: number; readonly y: number } => ({
  x: lander.x / POSITION_SCALE,
  y: lander.y / POSITION_SCALE,
});

/**
 * Where a mission starts [P PLYINIT, INTXCUR, INVELX]: top left of the whole-surface view, at
 * world (256, 2696), already flying right at 0x3200 (the instruments show 200), lying on its
 * side with the engine forward, ready to brake.
 */
export const START = {
  x: 256,
  y: 2696,
  vx: 0x3200,
  vy: 0x10,
  orientation: 16,
} as const;

/** The module at the start of a mission. */
export const startingLander = (): Lander => ({
  x: START.x * POSITION_SCALE,
  y: START.y * POSITION_SCALE,
  vx: START.vx,
  vy: START.vy,
  rotation: rotationAt(START.orientation),
});

/**
 * How far one frame of `speed` moves the module [P ACCEL]. The program adds only the top bits of
 * the speed to the screen position: 8 bits are lost in the whole-surface view, 6 in the
 * close-up. A very slow module therefore stands still in the large view.
 */
export const stepOf = (speed: number, view: View): number => {
  const mask = view === 'major' ? 0xff : 0x3f;
  return withSignOf(speed, Math.abs(speed) & ~mask);
};

/**
 * One frame of flight [P ACCEL]: the module moves with the speed it had, then gravity and the
 * engine change the speed for the next frame.
 */
export const moveLander = (
  lander: Lander,
  push: Push,
  rules: MissionRules,
  view: View,
): Lander => ({
  ...lander,
  x: lander.x + stepOf(lander.vx, view),
  y: lander.y + stepOf(lander.vy, view),
  vx: addSpeed(lander.vx, push.x),
  vy: addSpeed(addSpeed(lander.vy, -rules.gravity), push.y),
});

/** Frames between two slow-downs of TRAINING, and the frame of the 16 when it happens. */
const FRICTION_PERIOD = 16;
const FRICTION_FRAME = 8;

/** Whether TRAINING slows the module down in this frame [P N.MOT2: FRAME & 0F = 8]. */
export const isFrictionFrame = (frame: number): boolean =>
  frame % FRICTION_PERIOD === FRICTION_FRAME;

/** TRAINING friction on both speeds [P FRICTN]. */
export const slowDown = (lander: Lander): Lander => ({
  ...lander,
  vx: applyFriction(lander.vx),
  vy: applyFriction(lander.vy),
});
