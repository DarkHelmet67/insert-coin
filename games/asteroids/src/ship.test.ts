import { describe, expect, it } from 'vitest';
import {
  frictionAxis,
  MAX_VELOCITY,
  newShip,
  thrustAxis,
  turnShip,
  unitsPerFrame,
  updateShip,
  type Ship,
  type ShipControls,
} from './ship';

const IDLE: ShipControls = { turn: 0, thrust: false };
const THRUST: ShipControls = { turn: 0, thrust: true };

/** Runs `frames` frames with the same controls, starting at frame 0. */
const run = (ship: Ship, controls: ShipControls, frames: number): Ship =>
  Array.from({ length: frames }).reduce<Ship>(
    (current, _, frame) => updateShip(current, controls, frame),
    ship,
  );

describe('turnShip', () => {
  it('turns 3 units a frame and wraps around the full turn', () => {
    expect(turnShip(0, 1)).toBe(3);
    expect(turnShip(0, -1)).toBe(253);
    expect(turnShip(255, 1)).toBe(2);
  });
});

describe('thrust', () => {
  it('adds twice the cosine or sine to the velocity', () => {
    expect(thrustAxis(0, 127)).toBe(254);
    expect(thrustAxis(0, -127)).toBe(-254);
  });

  it('never passes the fastest velocity on an axis', () => {
    expect(thrustAxis(MAX_VELOCITY - 10, 127)).toBe(MAX_VELOCITY);
    expect(thrustAxis(-MAX_VELOCITY + 10, -127)).toBe(-MAX_VELOCITY);
  });

  it('reaches full speed after about two seconds of thrust', () => {
    const ship = run(newShip, THRUST, 130);
    expect(unitsPerFrame(ship.vx)).toBe(63);
    expect(ship.vy).toBe(0);
  });

  it('only pushes on even frames', () => {
    expect(updateShip(newShip, THRUST, 1).vx).toBe(0);
    expect(updateShip(newShip, THRUST, 2).vx).toBe(254);
  });
});

describe('friction', () => {
  it('slows a fast ship by about 1/128 of its velocity', () => {
    expect(frictionAxis(0x3000)).toBe(0x3000 - 0x61);
    expect(frictionAxis(-0x3000)).toBe(-0x3000 + 0x60);
  });

  it('brings a slow drift to a complete stop', () => {
    expect(frictionAxis(1)).toBe(0);
    expect(frictionAxis(-1)).toBe(1);
    expect(frictionAxis(0)).toBe(0);
  });

  it('halves a full speed in about three seconds', () => {
    const fast: Ship = { ...newShip, vx: MAX_VELOCITY };
    const ship = run(fast, IDLE, 180);
    expect(unitsPerFrame(ship.vx)).toBeGreaterThan(28);
    expect(unitsPerFrame(ship.vx)).toBeLessThan(36);
  });
});

describe('updateShip', () => {
  it('moves by the high byte of the velocity and wraps around the edges', () => {
    const ship: Ship = { ...newShip, position: { x: 8190, y: 100 }, vx: 0x0500, vy: -0x0200 };
    expect(updateShip(ship, IDLE, 1).position).toEqual({ x: 3, y: 98 });
  });

  it('remembers whether the thrust is on, for the flame', () => {
    expect(updateShip(newShip, THRUST, 1).thrusting).toBe(true);
    expect(updateShip(newShip, IDLE, 1).thrusting).toBe(false);
  });
});
