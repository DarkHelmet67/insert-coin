import { describe, expect, it } from 'vitest';
import { addFuel, burnFuel, engineBurn, fuelUnits, isEmpty, MAX_FUEL, tankWith } from './fuel';
import { MISSIONS } from './missions';
import { ABORT_THRUST } from './thrust';

describe('the fuel tank', () => {
  it('counts whole units for the instruments', () => {
    expect(fuelUnits(burnFuel(tankWith(750), 23))).toBe(749);
  });

  it('keeps track of the fuel burned', () => {
    expect(burnFuel(burnFuel(tankWith(750), 23), 6).used).toBe(29);
  });

  it('empties when less than one unit would be left', () => {
    const tank = burnFuel(tankWith(1), 1);
    expect(tank.fuel).toBe(0);
    expect(isEmpty(tank)).toBe(true);
  });

  it('holds at most 9999 units', () => {
    expect(addFuel(tankWith(9900), 750).fuel).toBe(MAX_FUEL);
  });
});

describe('the engine burn', () => {
  it('burns 23 hundredths a frame at full thrust, nothing when off', () => {
    expect(engineBurn(15, MISSIONS.cadet)).toBe(23);
    expect(engineBurn(0, MISSIONS.cadet)).toBe(0);
  });

  it('burns less in PRIME, except in ABORT', () => {
    expect(engineBurn(15, MISSIONS.prime)).toBe(15);
    expect(engineBurn(ABORT_THRUST, MISSIONS.prime)).toBe(217);
  });
});
