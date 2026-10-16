import { describe, expect, it } from 'vitest';
import { patternFromBytes, tickSpeed } from './speed';

/** How many of 32 updates move the actor. */
const movesIn32 = (pattern: number): number =>
  Array.from({ length: 32 }).reduce<{ pattern: number; moves: number }>(
    (acc) => {
      const tick = tickSpeed(acc.pattern);
      return { pattern: tick.pattern, moves: acc.moves + (tick.move ? 1 : 0) };
    },
    { pattern, moves: 0 },
  ).moves;

describe('patternFromBytes', () => {
  it('reads the two words of the program, high word first', () => {
    expect(patternFromBytes([0x2a, 0xaa, 0x55, 0x55], 0)).toBe(0xaa2a5555);
  });
});

describe('tickSpeed', () => {
  it('moves once for each bit set, and comes back to the start after 32 turns', () => {
    expect(movesIn32(0x55555555)).toBe(16);
    expect(movesIn32(0x22222222)).toBe(8);
    const once = tickSpeed(0x80000001);
    expect(once).toEqual({ pattern: 0x00000003, move: true });
  });
});
