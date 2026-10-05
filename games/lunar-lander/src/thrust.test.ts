import { describe, expect, it } from 'vitest';
import { MISSIONS } from './missions';
import {
  ABORT_THRUST,
  enginePush,
  leverThrust,
  multiplyFraction,
  SINES,
  THRUST_TABLE,
  verticalSineIndex,
} from './thrust';
import { tuning } from './tuning.config';
import { scaleSpeed } from './velocity';

/** A push of the program as the remake applies it, with the engine multiplier [N]. */
const remake = (programPush: number): number => scaleSpeed(programPush, tuning.physics.thrustScale);

describe('the thrust lever', () => {
  it('is off in the lowest quarter and full in the top eighth', () => {
    expect(leverThrust(0)).toBe(0);
    expect(leverThrust(63)).toBe(0);
    expect(leverThrust(64)).toBe(4);
    expect(leverThrust(224)).toBe(14);
    expect(leverThrust(225)).toBe(15);
    expect(leverThrust(255)).toBe(15);
  });

  it('jumps from 0 to 4 and never shows 1, 2 or 3', () => {
    const levels = new Set(Array.from({ length: 256 }, (_, lever) => leverThrust(lever)));
    expect([...levels]).toEqual([0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  });
});

describe('the push of the engine', () => {
  it('multiplies fractions as the program does', () => {
    expect(multiplyFraction(0xff, 0x1c)).toBe(0x1b);
  });

  it('splits the push along the axes', () => {
    expect(verticalSineIndex(8)).toBe(8);
    expect(verticalSineIndex(0)).toBe(0);
    expect(verticalSineIndex(12)).toBe(4);
    expect(verticalSineIndex(24)).toBe(8);
  });

  it('pushes straight up when upright, and sideways when lying', () => {
    expect(enginePush(8, 15, MISSIONS.cadet)).toEqual({ x: 0, y: remake(27) });
    expect(enginePush(0, 15, MISSIONS.cadet)).toEqual({ x: remake(27), y: 0 });
    expect(enginePush(16, 15, MISSIONS.cadet)).toEqual({ x: -remake(27), y: 0 });
    expect(enginePush(24, 15, MISSIONS.cadet)).toEqual({ x: 0, y: -remake(27) });
  });

  it('pushes left and up when turned to the left', () => {
    const push = enginePush(12, 15, MISSIONS.cadet);
    expect(push.x).toBeLessThan(0);
    expect(push.y).toBeGreaterThan(0);
  });

  it('in the program, beats gravity only above a certain level', () => {
    /** The program's upward push at a thrust level, without the remake's multiplier. */
    const programPush = (level: number): number =>
      multiplyFraction(SINES[8] ?? 0, THRUST_TABLE[level] ?? 0);
    expect(programPush(8)).toBeLessThan(0x11);
    expect(programPush(10)).toBeGreaterThan(0x11);
  });

  it('is half again as strong in PRIME, and huge in ABORT', () => {
    expect(enginePush(8, 15, MISSIONS.prime).y).toBe(remake(27 + 13));
    expect(enginePush(8, ABORT_THRUST, MISSIONS.cadet).y).toBe(0xfe);
  });
});
