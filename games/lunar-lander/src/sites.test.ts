import { describe, expect, it } from 'vitest';
import { startingCamera } from './camera';
import { chooseSites, chosenSiteLines, multiplierAt, SITES, sitesShown } from './sites';
import { surfaceHeight } from './surface';

describe('landing sites', () => {
  it('are flat stretches of the surface', () => {
    SITES.forEach((site) => {
      expect(surfaceHeight(site.x + 1)).toBe(site.y);
      expect(surfaceHeight(site.x + site.line - 1)).toBe(site.y);
    });
  });

  it('are chosen four at a time: two neighbours of the 2X group and two others', () => {
    expect(chooseSites(0)).toEqual([0, 1, 11, 4]);
    expect(chooseSites(0xff)).toEqual([3, 0, 4, 11]);
    expect(chooseSites(0b100111)).toEqual([3, 0, 9, 6]);
    Array.from({ length: 256 }, (_, random) => chooseSites(random)).forEach((sites) => {
      expect(new Set(sites).size).toBe(4);
      sites.slice(2).forEach((site) => {
        expect(site).toBeGreaterThanOrEqual(4);
        expect(site).toBeLessThanOrEqual(14);
      });
    });
  });

  it('give their multiplier only on top of them', () => {
    const chosen = [0, 1, 11, 4];
    expect(multiplierAt(2560, chosen)).toBe(2);
    expect(multiplierAt(2560 + 255, chosen)).toBe(2);
    expect(multiplierAt(2560 + 256, chosen)).toBe(1);
    expect(multiplierAt(2559, chosen)).toBe(1);
    expect(multiplierAt(1536 + 10, chosen)).toBe(5);
    expect(multiplierAt(1536 + 10, [0, 1, 2, 3])).toBe(1);
  });

  it('flash: 16 frames shown, 16 hidden', () => {
    expect(sitesShown(0)).toBe(false);
    expect(sitesShown(16)).toBe(true);
    expect(chosenSiteLines([0], startingCamera, 0)).toEqual([]);
    expect(chosenSiteLines([0], startingCamera, 16).length).toBeGreaterThan(1);
  });
});
