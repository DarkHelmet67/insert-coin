import { describe, expect, it } from 'vitest';
import { closeUpOn } from './camera';
import { noControls } from './controls';
import { POSITION_SCALE } from './lander';
import { startFlight, updateFlight, type FlightState } from './play';
import { rotationAt } from './rotation';

/** A CADET mission with the module at world (`x`, `y`), upright and still, in the close-up. */
const hovering = (x: number, y: number, vy = 0): FlightState => {
  const state = startFlight('cadet', 750, 0);
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
    const { state, event } = updateFlight(startFlight('cadet', 750, 0), noControls, 0);
    expect(event).toBe('flying');
    expect(state.frames).toBe(1);
  });

  it('pushes the lever up with the key', () => {
    const { state } = updateFlight(
      startFlight('cadet', 750, 0),
      { ...noControls, leverMove: 1 },
      0,
    );
    expect(state.lever).toBe(8);
  });

  it('touches down on a flat stretch', () => {
    expect(updateFlight(hovering(2600, 64 + 19), noControls, 0).event).toBe('touchdown');
  });

  it('crashes into the surface', () => {
    expect(updateFlight(hovering(2600, 64 + 19, -0x4000), noControls, 0).event).toBe('crash');
  });
});
