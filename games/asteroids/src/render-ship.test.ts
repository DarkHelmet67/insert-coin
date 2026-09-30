import { describe, expect, it } from 'vitest';
import { newShip } from './ship';
import { flameVisible, playerLines, shipLines } from './render-ship';

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

describe('playerLines', () => {
  it('draws the ship, its pieces or nothing', () => {
    expect(playerLines(newShip, { kind: 'flying' }, 0)).toHaveLength(5);
    expect(playerLines(newShip, { kind: 'exploding', status: 0xa0, age: 0 }, 0)).toHaveLength(6);
    expect(playerLines(newShip, { kind: 'hidden', timer: 3, reason: 'jump' }, 0)).toEqual([]);
  });
});
