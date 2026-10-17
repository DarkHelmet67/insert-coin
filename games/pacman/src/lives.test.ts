import { describe, expect, it } from 'vitest';
import { earnsExtraLife, livesTiles, livesWrites } from './lives';

/** The tile written at `address`. */
const tileAt = (shown: number, address: number) =>
  livesTiles(shown).find((cell) => cell.address === address)?.value;

describe('lives', () => {
  it('draws a little Pac-Man of 2 × 2 tiles per spare life, from the left', () => {
    expect(tileAt(2, 0x01a)).toBe(0x20);
    expect(tileAt(2, 0x03b)).toBe(0x23);
    expect(tileAt(2, 0x018)).toBe(0x20);
    expect(tileAt(2, 0x016)).toBe(0x40);
  });

  it('blanks every slot with no lives or with more than 5', () => {
    expect(livesTiles(0).every((cell) => cell.value === 0x40)).toBe(true);
    expect(livesTiles(6).every((cell) => cell.value === 0x40)).toBe(true);
    expect(livesTiles(5).every((cell) => cell.value !== 0x40)).toBe(true);
  });

  it('paints the row yellow', () => {
    expect(livesWrites(3).colors).toHaveLength(20);
  });

  it('gives the extra life once, at 10 000 points by default', () => {
    expect(earnsExtraLife(9990, 0, false)).toBe(false);
    expect(earnsExtraLife(10000, 0, false)).toBe(true);
    expect(earnsExtraLife(10000, 0, true)).toBe(false);
    expect(earnsExtraLife(14990, 1, false)).toBe(false);
    expect(earnsExtraLife(15000, 1, false)).toBe(true);
    expect(earnsExtraLife(99990, 3, false)).toBe(false);
  });
});
