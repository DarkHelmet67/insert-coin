import { movePoint, type Point } from './position';
import { cosine, sine } from './trig';

/**
 * The player's ship, moved with the integer arithmetic of the 6502 program [P $7086-$7138].
 * Velocities are kept in 1/256 of a position unit, like the program's two bytes per axis: the
 * high byte moves the ship, the low byte collects the small pushes of thrust and friction.
 */
export interface Ship {
  readonly position: Point;
  /** Velocity in 1/256 of a position unit per frame. */
  readonly vx: number;
  readonly vy: number;
  /** 0-255 for a full turn: 0 = right, 64 = up, 128 = left, 192 = down. */
  readonly direction: number;
  /** Whether the thrust button is held: it lights the flame and, later, the sound. */
  readonly thrusting: boolean;
}

/** What the player asks of the ship during one frame. */
export interface ShipControls {
  /** 1 to rotate left (counterclockwise), -1 to rotate right, 0 not to rotate. */
  readonly turn: -1 | 0 | 1;
  readonly thrust: boolean;
}

/** Where a new ship appears [P $71E8]: a little right of and above the exact center. */
export const SHIP_START: Point = { x: 0x1060, y: 0x0c60 };

/** A ship at the starting point, still and pointing right as after power-on. */
export const newShip: Ship = { position: SHIP_START, vx: 0, vy: 0, direction: 0, thrusting: false };

/** Direction units turned in one frame [P $708B]: a full turn in about 85 frames. */
export const TURN_STEP = 3;

/**
 * The fastest velocity on each axis [P $7125]: the high byte stays within -64..63, so the ship
 * moves at most 64 position units (8 screen units) per frame, horizontally and vertically.
 * The limit is per axis, so diagonally the ship goes about 1.4 times faster.
 */
export const MAX_VELOCITY = 0x3fff;

/** Turns the ship: the direction wraps around the full turn. */
export const turnShip = (direction: number, turn: -1 | 0 | 1): number =>
  (direction + TURN_STEP * turn) & 0xff;

/** Keeps a velocity within the limits of the program. */
export const clampVelocity = (velocity: number): number =>
  Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocity));

/** One push of thrust on one axis [P $70AA]: twice the sine or cosine of the direction. */
export const thrustAxis = (velocity: number, trig: number): number =>
  clampVelocity(velocity + 2 * trig);

/**
 * One step of friction on one axis [P $70E6]: the velocity loses twice its high byte (plus one
 * when moving right or up), about 1/128 of itself. Fast ships slow down quickly, slow ones drift
 * for a long time: the inertia that makes Asteroids feel like space.
 */
export const frictionAxis = (velocity: number): number => {
  if (velocity === 0) return 0;
  const high = velocity >> 8;
  return high >= 0 ? velocity - (2 * high + 1) : velocity - 2 * high;
};

/** Position units the ship moves in one frame: only the high byte counts [P $6FC7]. */
export const unitsPerFrame = (velocity: number): number => velocity >> 8;

/**
 * One frame of the ship: rotation every frame, then thrust or friction only on even frames
 * [P $709B], then the move, which wraps around the edges.
 */
export const updateShip = (ship: Ship, controls: ShipControls, frame: number): Ship => {
  const direction = turnShip(ship.direction, controls.turn);
  const evenFrame = frame % 2 === 0;
  const [vx, vy] = !evenFrame
    ? [ship.vx, ship.vy]
    : controls.thrust
      ? [thrustAxis(ship.vx, cosine(direction)), thrustAxis(ship.vy, sine(direction))]
      : [frictionAxis(ship.vx), frictionAxis(ship.vy)];
  return {
    position: movePoint(ship.position, unitsPerFrame(vx), unitsPerFrame(vy)),
    vx,
    vy,
    direction,
    thrusting: controls.thrust,
  };
};
