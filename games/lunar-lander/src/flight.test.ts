import { describe, expect, it } from 'vitest';
import { flyFrame, type Flight } from './flight';
import { tankWith } from './fuel';
import { landerOrientation, startingLander } from './lander';
import { MISSIONS } from './missions';

/** A module at the start of a mission with a coin's worth of fuel. */
const flight = (units = 750): Flight => ({ lander: startingLander(), tank: tankWith(units) });

describe('one frame of flight', () => {
  it('burns fuel for the engine and for turning', () => {
    const next = flyFrame(
      flight(),
      { turn: -1, thrust: 15, steering: true },
      MISSIONS.cadet,
      'major',
      0,
    );
    expect(next.flight.tank.used).toBe(23 + 6);
    expect(landerOrientation(next.flight.lander)).toBe(15);
  });

  it('pushes with the orientation the module had before turning', () => {
    const next = flyFrame(
      flight(),
      { turn: -1, thrust: 15, steering: true },
      MISSIONS.cadet,
      'major',
      0,
    );
    expect(next.flight.lander.vx).toBe(0x3200 - 27);
  });

  it('stops the engine and the rotation when the tank is empty', () => {
    const next = flyFrame(
      flight(0),
      { turn: -1, thrust: 15, steering: true },
      MISSIONS.cadet,
      'major',
      0,
    );
    expect(next.thrust).toBe(0);
    expect(landerOrientation(next.flight.lander)).toBe(16);
    expect(next.flight.lander.vx).toBe(0x3200);
  });

  it('does not turn during an abort', () => {
    const next = flyFrame(
      flight(),
      { turn: -1, thrust: 0, steering: false },
      MISSIONS.cadet,
      'major',
      0,
    );
    expect(landerOrientation(next.flight.lander)).toBe(16);
    expect(next.flight.tank.used).toBe(0);
  });

  it('slows the module down in TRAINING on the friction frame', () => {
    const next = flyFrame(
      flight(),
      { turn: 0, thrust: 0, steering: true },
      MISSIONS.training,
      'major',
      8,
    );
    expect(next.flight.lander.vx).toBe(0x3200 - 0x190);
  });
});
