import type { BeamLine } from './shape';

/** A rectangle of the world: from (`left`, `bottom`) to (`right`, `top`), y upwards. */
export interface ClipRect {
  readonly left: number;
  readonly bottom: number;
  readonly right: number;
  readonly top: number;
}

/**
 * The visible range of the Atari Digital Vector Generator: coordinates from 0 to 1023. The
 * hardware stops the beam as soon as a counter leaves this range and starts it again when it
 * comes back, so a line that crosses the border is cut exactly there.
 */
export const DVG_CLIP: ClipRect = { left: 0, bottom: 0, right: 1023, top: 1023 };

/** The part of the line from t0 to t1, where t goes from 0 at its start to 1 at its end. */
const segment = (line: BeamLine, t0: number, t1: number): BeamLine => {
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;
  return {
    x1: line.x1 + t0 * dx,
    y1: line.y1 + t0 * dy,
    x2: line.x1 + t1 * dx,
    y2: line.y1 + t1 * dy,
    brightness: line.brightness,
  };
};

/**
 * The range of t (from 0 to 1) where `from + t * delta` stays between `min` and `max`, narrowed
 * from `[t0, t1]`; `null` when the line is outside. One axis of the Liang-Barsky algorithm.
 */
const clipAxis = (
  from: number,
  delta: number,
  min: number,
  max: number,
  [t0, t1]: readonly [number, number],
): readonly [number, number] | null => {
  if (delta === 0) return from < min || from > max ? null : [t0, t1];
  const enter = ((delta > 0 ? min : max) - from) / delta;
  const leave = ((delta > 0 ? max : min) - from) / delta;
  const start = Math.max(t0, enter);
  const end = Math.min(t1, leave);
  return start > end ? null : [start, end];
};

/** The part of one line inside `rect`, or `null` if none of it is. Dots stay dots. */
export const clipLine = (line: BeamLine, rect: ClipRect): BeamLine | null => {
  const inX = clipAxis(line.x1, line.x2 - line.x1, rect.left, rect.right, [0, 1]);
  const inBoth = inX && clipAxis(line.y1, line.y2 - line.y1, rect.bottom, rect.top, inX);
  return inBoth ? segment(line, inBoth[0], inBoth[1]) : null;
};

/**
 * Keeps only what lies inside `rect`, cutting the lines that cross its border. Games that scroll
 * a long drawing past the screen (the terrain of Lunar Lander) use it to hide what the vector
 * generator would not draw.
 */
export const clipLines = (lines: readonly BeamLine[], rect: ClipRect): readonly BeamLine[] =>
  lines.flatMap((line) => {
    const clipped = clipLine(line, rect);
    return clipped ? [clipped] : [];
  });
