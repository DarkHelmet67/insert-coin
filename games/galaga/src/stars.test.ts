import { describe, expect, it } from 'vitest';
import {
  advanceStars,
  nextLfsr,
  STAR_COUNT,
  starSets,
  STARS_SLOW,
  STARS_STILL,
  visibleStars,
} from './stars';

describe('nextLfsr', () => {
  it('runs through all 65,535 non-zero states before repeating', () => {
    let lfsr = 0x7fff;
    let steps = 0;
    do {
      lfsr = nextLfsr(lfsr);
      steps += 1;
    } while (lfsr !== 0x7fff && steps < 70000);
    expect(steps).toBe(65535);
  });
});

describe('the starfield', () => {
  it('can generate 256 stars', () => {
    expect(STAR_COUNT).toBe(256);
  });

  it('shows two of the four sets, changing every 4 frames', () => {
    expect(starSets(0)).toEqual([0, 2]);
    expect(starSets(4)).toEqual([0, 2]);
    expect(starSets(8)).toEqual([1, 2]);
    expect(new Set([0, 8, 16, 24].map((frame) => starSets(frame).join()))).toHaveLength(4);
  });

  it('keeps the stars still at speed 7', () => {
    const phase = advanceStars(0, STARS_STILL);
    expect(visibleStars(phase, STARS_STILL, 0)).toEqual(visibleStars(0, STARS_STILL, 0));
  });

  it('moves the stars down one pixel a frame at speed 6', () => {
    const before = visibleStars(0, STARS_SLOW, 0);
    const after = visibleStars(advanceStars(0, STARS_SLOW), STARS_SLOW, 0);
    const star = before.find((s) => s.y > 20 && s.y < 250);
    expect(star).toBeDefined();
    expect(after).toContainEqual({ ...star, y: (star?.y ?? 0) + 1 });
  });

  it('shows fewer than 128 stars, all inside the screen', () => {
    const stars = visibleStars(1234, STARS_SLOW, 0);
    expect(stars.length).toBeGreaterThan(60);
    expect(stars.length).toBeLessThan(128);
    stars.forEach((s) => {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThan(224);
      expect(s.y).toBeGreaterThanOrEqual(16);
    });
  });
});
