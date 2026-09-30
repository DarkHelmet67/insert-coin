import { describe, expect, it } from 'vitest';
import { nextRandom, nextRandomAfter, seedRandom, smallSigned } from './random';

describe('nextRandom', () => {
  it('leaves the all-zero state that follows power-on', () => {
    expect(nextRandom({ lo: 0, hi: 0 })).toEqual({ value: 1, rng: { lo: 1, hi: 0 } });
  });

  it('shifts the two bytes as one number, feeding the top bit back', () => {
    // 0x80 in the low byte moves to the high byte; bit 1 is clear, so nothing flips.
    expect(nextRandom({ lo: 0x80, hi: 0x00 }).rng).toEqual({ lo: 0x00, hi: 0x01 });
    // The high byte's top bit set after the shift adds one to the low byte.
    expect(nextRandom({ lo: 0x00, hi: 0x40 }).rng).toEqual({ lo: 0x01, hi: 0x80 });
  });

  it('flips bit 0 when bit 1 is set', () => {
    expect(nextRandom({ lo: 0x01, hi: 0x00 }).value).toBe(0x03);
  });

  it('keeps producing a long, varied sequence', () => {
    const values = Array.from({ length: 500 }).reduce<{
      rng: ReturnType<typeof seedRandom>;
      seen: Set<number>;
    }>(
      ({ rng, seen }) => {
        const draw = nextRandom(rng);
        return { rng: draw.rng, seen: seen.add(draw.value) };
      },
      { rng: seedRandom(1234), seen: new Set() },
    ).seen;
    expect(values.size).toBeGreaterThan(200);
  });
});

describe('nextRandomAfter', () => {
  it('keeps the last of several draws', () => {
    const rng = seedRandom(42);
    const threeSteps = nextRandom(nextRandom(nextRandom(rng).rng).rng);
    expect(nextRandomAfter(rng, 3)).toEqual(threeSteps);
  });
});

describe('smallSigned', () => {
  it('gives -16..15 from the sign and the low four bits', () => {
    expect(smallSigned(0x0f)).toBe(15);
    expect(smallSigned(0x7a)).toBe(10);
    expect(smallSigned(0x80)).toBe(-16);
    expect(smallSigned(0xff)).toBe(-1);
  });
});
