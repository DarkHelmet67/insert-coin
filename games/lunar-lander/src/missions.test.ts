import { describe, expect, it } from 'vitest';
import { MISSIONS, nextMission } from './missions';

describe('missions', () => {
  it('walks through the four missions with SELECT and starts again', () => {
    expect(nextMission('training')).toBe('cadet');
    expect(nextMission('cadet')).toBe('prime');
    expect(nextMission('prime')).toBe('command');
    expect(nextMission('command')).toBe('training');
  });

  it('gives PRIME double gravity, a stronger engine and a smaller fuel factor', () => {
    expect(MISSIONS.prime.gravity).toBe(2 * MISSIONS.cadet.gravity);
    expect(MISSIONS.prime.strongEngine).toBe(true);
    expect(MISSIONS.prime.fuelFactor).toBeLessThan(MISSIONS.cadet.fuelFactor);
  });
});
