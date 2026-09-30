import type { BeamLine } from './shape';
import { toPixel, type PixelMapping } from './viewport';

/**
 * How the beam looks. A vector monitor draws a thin, very bright line, and the phosphor around
 * it glows: the remake strokes each line once, with a blurred shadow of the glow color around it.
 * Sizes are in world units, like the drawings: the picture looks the same on a phone and on a
 * large monitor, as the beam spot of a real tube grows with the size of the tube.
 */
export interface BeamStyle {
  /** Color of the line itself. */
  readonly color: string;
  /** Color of the glow around it; its alpha sets how strong the glow is. */
  readonly glowColor: string;
  /** Width of the line, in world units. */
  readonly coreWidth: number;
  /** How far the glow spreads, in world units (0 for no glow). */
  readonly glowBlur: number;
  /** Diameter of a dot (a shot, a spark), in world units. */
  readonly dotSize: number;
  /** The brightest value of the hardware: 15 on the Atari vector generators. */
  readonly maxBrightness: number;
  /**
   * Curve from brightness to opacity: 1 is linear, less than 1 lifts the dim lines, as the
   * phosphor does. The Atari games drew most things at 7 of 15, which a linear curve makes too dim.
   */
  readonly gamma: number;
}

/** Opacity of a line of the given brightness: 0 for off, 1 for the brightest. */
export const beamAlpha = (style: BeamStyle, brightness: number): number =>
  Math.min(1, Math.max(0, brightness / style.maxBrightness)) ** style.gamma;

/** Whether a line is a dot: the beam stood still. */
export const isDot = (line: BeamLine): boolean => line.x1 === line.x2 && line.y1 === line.y2;

/**
 * Groups lines by brightness, so each group is drawn with one path: fewer state changes on the
 * canvas, and a whole screen of lines costs a handful of strokes.
 */
export const groupByBrightness = (
  lines: readonly BeamLine[],
): ReadonlyMap<number, readonly BeamLine[]> =>
  new Map(
    [...new Set(lines.map((line) => line.brightness))].map((brightness) => [
      brightness,
      lines.filter((line) => line.brightness === brightness),
    ]),
  );

/** The part of the canvas context the beam uses. */
export type BeamContext = Pick<
  CanvasRenderingContext2D,
  | 'beginPath'
  | 'moveTo'
  | 'lineTo'
  | 'arc'
  | 'stroke'
  | 'fill'
  | 'strokeStyle'
  | 'fillStyle'
  | 'lineWidth'
  | 'lineCap'
  | 'lineJoin'
  | 'globalAlpha'
  | 'globalCompositeOperation'
  | 'shadowBlur'
  | 'shadowColor'
>;

/** Adds the lines (not the dots) of one group to the current path. */
const traceLines = (ctx: BeamContext, lines: readonly BeamLine[], mapping: PixelMapping): void => {
  ctx.beginPath();
  lines
    .filter((line) => !isDot(line))
    .forEach((line) => {
      const from = toPixel(mapping, line.x1, line.y1);
      const to = toPixel(mapping, line.x2, line.y2);
      ctx.moveTo(from.px, from.py);
      ctx.lineTo(to.px, to.py);
    });
};

/** Adds a circle of `diameter` pixels for every dot of one group to the current path. */
const traceDots = (
  ctx: BeamContext,
  lines: readonly BeamLine[],
  mapping: PixelMapping,
  diameter: number,
): void => {
  ctx.beginPath();
  lines.filter(isDot).forEach((dot) => {
    const { px, py } = toPixel(mapping, dot.x1, dot.y1);
    ctx.moveTo(px + diameter / 2, py);
    ctx.arc(px, py, diameter / 2, 0, 2 * Math.PI);
  });
};

/** Converts a width in world units to pixels, never thinner than one pixel. */
export const widthInPixels = (units: number, mapping: PixelMapping): number =>
  Math.max(1, units * mapping.scale);

/** Draws one group of lines of the same brightness, lines first and then dots. */
const drawGroup = (
  ctx: BeamContext,
  lines: readonly BeamLine[],
  alpha: number,
  mapping: PixelMapping,
  style: BeamStyle,
): void => {
  ctx.globalAlpha = alpha;
  traceLines(ctx, lines, mapping);
  ctx.stroke();
  traceDots(ctx, lines, mapping, widthInPixels(style.dotSize, mapping));
  ctx.fill();
};

/**
 * Draws beam lines on the canvas. Overlapping lines add up their light ('lighter'), as they do
 * on the phosphor where the beam crosses the same spot twice.
 */
export const drawBeamLines = (
  ctx: BeamContext,
  lines: readonly BeamLine[],
  mapping: PixelMapping,
  style: BeamStyle,
): void => {
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = style.color;
  ctx.fillStyle = style.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = widthInPixels(style.coreWidth, mapping);
  // The glow: a shadow blurred around every line, in canvas pixels.
  ctx.shadowColor = style.glowColor;
  ctx.shadowBlur = style.glowBlur * mapping.scale;
  groupByBrightness(lines).forEach((group, brightness) => {
    const alpha = beamAlpha(style, brightness);
    if (alpha > 0) drawGroup(ctx, group, alpha, mapping, style);
  });
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'source-over';
};
