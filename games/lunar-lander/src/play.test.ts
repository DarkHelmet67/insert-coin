import { describe, expect, it } from 'vitest';
import { closeUpOn } from './camera';
import { noControls } from './controls';
import { tankWith } from './fuel';
import { POSITION_SCALE } from './lander';
import { startFlight, updateFlight, type FlightState } from './play';
import { rotationAt } from './rotation';

/** A CADET mission with the module at world (`x`, `y`), upright and still, in the close-up. */
const hovering = (x: number, y: number, vy = 0): FlightState => {
  const state = startFlight('cadet', tankWith(750), 0);
  return {
    ...state,
    camera: closeUpOn(x, y),
    flight: {
      ...state.flight,
      lander: { x: x * POSITION_SCALE, y: y * POSITION_SCALE, vx: 0, vy, rotation: rotationAt(8) },
    },
  };
};

describe('a frame of flight', () => {
  it('keeps flying high above the surface', () => {
    const { state, event } = updateFlight(startFlight('cadet', tankWith(750), 0), noControls, 0, 0);
    expect(event).toBe('flying');
    expect(state.frames).toBe(1);
  });

  it('fires the engine with the lever up', () => {
    const { state } = updateFlight(startFlight('cadet', tankWith(750), 0), noControls, 0, 255);
    expect(state.thrust).toBe(15);
  });

  it('touches down on a flat stretch', () => {
    expect(updateFlight(hovering(2600, 64 + 19), noControls, 0, 0).event).toBe('touchdown');
  });

  it('crashes into the surface', () => {
    expect(updateFlight(hovering(2600, 64 + 19, -0x4000), noControls, 0, 0).event).toBe('crash');
  });
});
