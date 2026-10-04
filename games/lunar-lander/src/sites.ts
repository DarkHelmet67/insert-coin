import { atariVectorFont, textToLines, type BeamLine } from '@arcade/vector';
import { toScreen, zoomOf, type Camera } from './camera';
import { wrapX } from './surface';

/**
 * The landing sites with a bonus [P PLYINIT, SITES, LNDADR; R TBMNA, TBMNV, TBLABS]. The ROM lists
 * 15 flat stretches of the surface; each mission picks 4 and makes them flash with their
 * multiplier, "2X" to "5X". See docs/meccaniche-originali.md, section 6.
 */

/** A landing site. */
export interface Site {
  /** Left end, in world units [R TBMNA]. */
  readonly x: number;
  readonly y: number;
  /** Width that counts for the bonus [P TSTLNG]: 255, 128, 64 or 32 units. */
  readonly width: number;
  /** Length of the bright line [R TBMNV]: as the width, but 256 and 31 at the two ends. */
  readonly line: number;
  /** Points multiplier [P TBSTFT]. */
  readonly multiplier: number;
}

/** Brightness of the flashing line [R .SITBRT]. */
export const SITE_BRIGHTNESS = 13;

/** The four sizes of site [P TSTLNG; R TBMNV]: bonus width, line length, label offset. */
const SIZES = [
  { width: 0xff, line: 256, labelBack: 134 },
  { width: 0x80, line: 128, labelBack: 70 },
  { width: 0x40, line: 64, labelBack: 38 },
  { width: 0x20, line: 31, labelBack: 24 },
] as const;

/** The 15 sites of the ROM: x, y, size (index in SIZES, from MNVAL / 8), multiplier. */
const SITE_TABLE: readonly (readonly [x: number, y: number, size: 0 | 1 | 2 | 3, times: number])[] =
  [
    [2560, 64, 0, 2],
    [3456, 64, 1, 2],
    [1056, 192, 2, 2],
    [3264, 96, 2, 2],
    [256, 384, 3, 3],
    [3872, 608, 2, 3],
    [0, 896, 3, 4],
    [608, 736, 3, 4],
    [800, 512, 3, 4],
    [1792, 1440, 3, 4],
    [3040, 448, 3, 5],
    [1536, 864, 3, 5],
    [2176, 928, 3, 5],
    [2240, 704, 3, 5],
    [2432, 224, 3, 5],
  ];

/** The sites with their sizes. */
export const SITES: readonly Site[] = SITE_TABLE.map(([x, y, size, multiplier]) => ({
  x,
  y,
  width: SIZES[size].width,
  line: SIZES[size].line,
  multiplier,
}));

/** How far back from the right end of the line the label goes [R TBMNV], at full zoom. */
const labelBack = (site: Site): number =>
  SIZES.find((size) => size.line === site.line)?.labelBack ?? 24;

/** Last nudge to the left of the label, not zoomed [R B.XOFF]. */
const LABEL_NUDGE = 6;

/** Drop below the line of the label [R TBMNV]. */
const LABEL_DROP = 20;

/**
 * A site from 4 to 14 [P BNSITE]: numbers 0 to 3 become 11, 10, 11 and 14, so the large sites
 * of the first group never come twice.
 */
const bonusSite = (n: number): number => (n < 4 ? (n + 1) | 0x0a : n);

/**
 * The four sites of a mission, from a random byte [P PLYINIT: the interrupt counter]: two
 * neighbours among the large sites 0-3 (2X), and two among the others.
 */
export const chooseSites = (random: number): readonly number[] => {
  const first = random & 3;
  const middle = (random >> 2) & 0x0f;
  const third = bonusSite(middle === 0x0f ? 4 : middle);
  return [first, (first + 1) & 3, third, bonusSite(third ^ 0x0f)];
};

/** The sites flash: shown for 16 frames, hidden for 16 [P SITES: FRAME & 10]. */
export const sitesShown = (frame: number): boolean => (frame & 0x10) !== 0;

/** The bright line and the "nX" label of one site. */
const siteLines = (site: Site, camera: Camera): readonly BeamLine[] => {
  const zoom = zoomOf(camera.view);
  const start = toScreen(camera, site.x, site.y);
  const end = start.x + site.line / zoom;
  const label = {
    x: end - labelBack(site) / zoom - LABEL_NUDGE,
    y: start.y - LABEL_DROP,
    brightness: 12,
  };
  return [
    { x1: start.x, y1: start.y, x2: end, y2: start.y, brightness: SITE_BRIGHTNESS },
    ...textToLines(atariVectorFont, `${String(site.multiplier)}X`, label),
  ];
};

/** The chosen sites, when they are shown in this frame. */
export const chosenSiteLines = (
  chosen: readonly number[],
  camera: Camera,
  frame: number,
): readonly BeamLine[] =>
  sitesShown(frame)
    ? chosen.flatMap((index) => {
        const site = SITES[index];
        return site === undefined ? [] : siteLines(site, camera);
      })
    : [];

/**
 * The multiplier for a landing at world x (the module's position), 1 outside the chosen sites
 * [P LNDADR: 0 <= x - site x <= width].
 */
export const multiplierAt = (x: number, chosen: readonly number[]): number => {
  const site = chosen
    .map((index) => SITES[index])
    .find((candidate) => candidate !== undefined && wrapX(x - candidate.x) <= candidate.width);
  return site?.multiplier ?? 1;
};
