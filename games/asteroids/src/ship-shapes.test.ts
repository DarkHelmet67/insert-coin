import { shapeEnd } from '@arcade/vector';
import { describe, expect, it } from 'vitest';
import { SHIP_PICTURES, shipView } from './ship-shapes';

describe('SHIP_PICTURES', () => {
  it('has one drawing every 4 units from right to up, each one a closed outline', () => {
    expect(SHIP_PICTURES).toHaveLength(17);
    // Every outline returns to its first corner (the first blank move), give or take one unit:
    // Atari rounded the rotated drawings by hand, and some miss the corner by a hair.
    SHIP_PICTURES.forEach(({ ship }) => {
      const [[dx, dy]] = ship as [readonly [number, number, number]];
      const end = shapeEnd(ship);
      expect(Math.abs(end.dx - dx)).toBeLessThanOrEqual(1);
      expect(Math.abs(end.dy - dy)).toBeLessThanOrEqual(1);
    });
  });
});

describe('shipView', () => {
  it('uses the drawings as they are between right and up', () => {
    expect(shipView(0)).toEqual({ picture: 0, flipX: false, flipY: false });
    expect(shipView(7)).toEqual({ picture: 1, flipX: false, flipY: false });
    expect(shipView(64)).toEqual({ picture: 16, flipX: true, flipY: false });
  });

  it('mirrors them for the other three quarters of the turn', () => {
    expect(shipView(128)).toEqual({ picture: 0, flipX: true, flipY: true });
    expect(shipView(96)).toEqual({ picture: 8, flipX: true, flipY: false });
    expect(shipView(192)).toEqual({ picture: 16, flipX: true, flipY: true });
    expect(shipView(224)).toEqual({ picture: 8, flipX: false, flipY: true });
  });

  it('wraps directions outside 0-255', () => {
    expect(shipView(256 + 7)).toEqual(shipView(7));
  });
});
