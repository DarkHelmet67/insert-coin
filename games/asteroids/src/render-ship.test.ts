import { describe, expect, it } from 'vitest';
import { newShip } from './ship';
import { flameVisible, shipLines } from './render-ship';

describe('flameVisible', () => {
  it('flickers 4 frames on and 4 off while thrusting', () => {
    const thrusting = { ...newShip, thrusting: true };
    expect([0, 3, 4, 7, 8].map((frame) => flameVisible(thrusting, frame))).toEqual([
      false,
      false,
      true,
      true,
      false,
    ]);
    expect(flameVisible(newShip, 4)).toBe(false);
  });
});

describe('shipLines', () => {
  it('draws the five sides of the ship, plus the two of the flame when it shows', () => {
    expect(shipLines(newShip, 4)).toHaveLength(5);
    expect(shipLines({ ...newShip, thrusting: true }, 4)).toHaveLength(7);
  });

  it('draws the ship where its position falls on the screen', () => {
    const xs = shipLines(newShip, 0).flatMap((line) => [line.x1, line.x2]);
    // Start point $1060 / 8 = 524: the ship is about 24 units long around it.
    expect(Math.min(...xs)).toBeGreaterThan(510);
    expect(Math.max(...xs)).toBeLessThan(540);
  });
});
