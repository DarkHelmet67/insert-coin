import { describe, expect, it } from 'vitest';
import {
  addPoints,
  DIRECTION,
  directionStep,
  isTunnelTile,
  oppositeDirection,
  tileAddress,
  tileOf,
} from './geometry';
import { cellAddress } from './video';

describe('directionStep', () => {
  it('reads the steps of table $32FF: x grows to the left, y downwards', () => {
    expect(directionStep(DIRECTION.right)).toEqual({ x: 0xff, y: 0 });
    expect(directionStep(DIRECTION.down)).toEqual({ x: 0, y: 1 });
    expect(directionStep(DIRECTION.left)).toEqual({ x: 1, y: 0 });
    expect(directionStep(DIRECTION.up)).toEqual({ x: 0, y: 0xff });
  });
});

describe('addPoints', () => {
  it('wraps around like bytes, which joins the two tunnel ends', () => {
    expect(addPoints({ x: 0, y: 4 }, directionStep(DIRECTION.right))).toEqual({ x: 0xff, y: 4 });
  });
});

describe('oppositeDirection', () => {
  it('turns around', () => {
    expect(oppositeDirection(DIRECTION.up)).toBe(DIRECTION.down);
    expect(oppositeDirection(DIRECTION.left)).toBe(DIRECTION.right);
  });
});

describe('tileOf and tileAddress', () => {
  it("put Pac-Man's start on row 26, columns 13-14", () => {
    const tile = tileOf({ x: 0x80, y: 0xc4 });
    expect(tile).toEqual({ x: 0x2e, y: 0x38 });
    expect(tileAddress(tile)).toBe(cellAddress(13, 26));
  });

  it('recognizes the tunnels', () => {
    expect(isTunnelTile({ x: 0x20, y: 0x2e })).toBe(true);
    expect(isTunnelTile({ x: 0x3b, y: 0x2e })).toBe(true);
    expect(isTunnelTile({ x: 0x2e, y: 0x2e })).toBe(false);
  });
});
