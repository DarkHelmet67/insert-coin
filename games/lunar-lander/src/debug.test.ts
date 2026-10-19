import { describe, expect, it } from 'vitest';
import { debug, DEBUG_OFF } from './debug';
import { flyFrame, type Flight } from './flight';
import { tankWith } from './fuel';
import { spareInGodMode } from './landing';
import { startingLander } from './lander';
import { missionForLevel, MISSIONS } from './missions';
import { tuning } from './tuning.config';

/** A module at the start of a mission with a coin's worth of fuel. */
const flight: Flight = { lander: startingLander(), tank: tankWith(750) };

describe('debug mode', () => {
  it('is off in the published game', () => {
    expect(tuning.debug.enabled).toBe(false);
    expect(debug).toEqual(DEBUG_OFF);
  });

  it('picks the mission of a new game in SELECT order', () => {
    expect([1, 2, 3, 4].map(missionForLevel)).toEqual(['training', 'cadet', 'prime', 'command']);
    expect(missionForLevel(9)).toBe('training');
  });

  it('with infinite fuel the tank stays full at full thrust', () => {
    const commands = { turn: -1, thrust: 15, steering: true } as const;
    const burned = flyFrame(flight, commands, MISSIONS.cadet, 'major', 0, false);
    const kept = flyFrame(flight, commands, MISSIONS.cadet, 'major', 0, true);
    expect(burned.flight.tank.fuel).toBeLessThan(flight.tank.fuel);
    expect(kept.flight.tank).toEqual(flight.tank);
    expect(kept.flight.lander).toEqual(burned.flight.lander);
  });

  it('in god mode a crash counts as a hard landing', () => {
    expect(spareInGodMode('crash', false)).toBe('crash');
    expect(spareInGodMode('crash', true)).toBe('hard');
    expect(spareInGodMode('good', true)).toBe('good');
  });
});
