import { describe, expect, it } from 'vitest';
import { abortFrame, ABORT_CLIMB, ABORT_FRAMES, towardUpright } from './abort';
import { landerOrientation, startingLander, type Lander } from './lander';
import { rotationAt } from './rotation';
import { ABORT_THRUST } from './thrust';

/** A module with the given orientation and speeds. */
const lander = (orientation: number, vx = 0, vy = 0): Lander => ({
  ...startingLander(),
  vx,
  vy,
  rotation: rotationAt(orientation),
});

describe('ABORT', () => {
  it('turns the module upright the shorter way', () => {
    expect(towardUpright(16)).toBe(15);
    expect(towardUpright(0)).toBe(1);
    expect(towardUpright(24)).toBe(23);
    expect(towardUpright(25)).toBe(26);
    expect(towardUpright(31)).toBe(0);
    expect(towardUpright(8)).toBe(8);
  });

  it('turns only on odd frames and keeps the thrust until upright', () => {
    const even = abortFrame(lander(16), ABORT_FRAMES, 5, 0);
    expect(landerOrientation(even.lander)).toBe(16);
    const odd = abortFrame(lander(16), ABORT_FRAMES, 5, 1);
    expect(landerOrientation(odd.lander)).toBe(15);
    expect(odd.thrust).toBe(5);
    expect(odd.count).toBe(ABORT_FRAMES);
  });

  it('drains the sideways speed by 256 a frame', () => {
    expect(abortFrame(lander(8, 0x3200), ABORT_FRAMES, 0, 0).lander.vx).toBe(0x3100);
    expect(abortFrame(lander(8, -0x80), ABORT_FRAMES, 0, 0).lander.vx).toBe(0);
  });

  it('fires at full power once upright', () => {
    const upright = abortFrame(lander(8), ABORT_FRAMES, 0, 0);
    expect(upright.thrust).toBe(ABORT_THRUST);
    expect(upright.count).toBe(ABORT_FRAMES - 1);
  });

  it('stops after 40 frames once the module climbs fast enough', () => {
    expect(abortFrame(lander(8, 0, ABORT_CLIMB), 70, ABORT_THRUST, 0).count).toBe(69);
    expect(abortFrame(lander(8, 0, ABORT_CLIMB), 59, ABORT_THRUST, 0).count).toBe(0);
  });

  it('does nothing when no abort is running', () => {
    const still = lander(16, 100);
    expect(abortFrame(still, 0, 3, 1)).toEqual({ lander: still, count: 0, thrust: 3 });
  });
});
