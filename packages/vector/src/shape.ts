/**
 * Vector shapes as the Atari vector generators stored them: a list of steps, each one moving
 * the beam by (dx, dy) from where the previous step left it. A step with brightness 0 moves
 * the beam without drawing; a step of length 0 with a brightness draws a dot.
 * Coordinates follow the vector hardware: x to the right, y upwards.
 */

/** One step of the beam: how far it moves and how bright it is while moving (0 = off, 15 = max). */
export type VectorStep = readonly [dx: number, dy: number, brightness: number];

/** A drawing made of beam steps, starting from the position where it is placed. */
export type VectorShape = readonly VectorStep[];

/** A line drawn by the beam, in world coordinates. A dot has the same start and end. */
export interface BeamLine {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly brightness: number;
}

/** Where and how a shape is drawn. Only `x` and `y` are required. */
export interface Placement {
  readonly x: number;
  readonly y: number;
  /** Size multiplier: the vector hardware used powers of two, any number works here. */
  readonly scale?: number;
  /** Rotation in radians, counterclockwise (y is upwards). */
  readonly angle?: number;
  /** Mirror images: the Atari games drew one quarter of the rotations and flipped the rest. */
  readonly flipX?: boolean;
  readonly flipY?: boolean;
}

/** A 2D offset. */
export interface Offset {
  readonly dx: number;
  readonly dy: number;
}

/** Applies the flips, the scale and the rotation of `placement` to one step offset. */
export const transformOffset = (dx: number, dy: number, placement: Placement): Offset => {
  const scale = placement.scale ?? 1;
  const angle = placement.angle ?? 0;
  const x = (placement.flipX ? -dx : dx) * scale;
  const y = (placement.flipY ? -dy : dy) * scale;
  if (angle === 0) return { dx: x, dy: y };
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { dx: x * cos - y * sin, dy: x * sin + y * cos };
};

/** The beam's position and the lines it has drawn so far, while a shape is being traced. */
interface Trace {
  readonly x: number;
  readonly y: number;
  readonly lines: readonly BeamLine[];
}

/**
 * Follows the beam through `shape` placed at `placement` and returns the lines it draws.
 * Steps with brightness 0 only move the beam.
 */
export const shapeToLines = (shape: VectorShape, placement: Placement): readonly BeamLine[] =>
  shape.reduce<Trace>(
    (trace, [dx, dy, brightness]) => {
      const offset = transformOffset(dx, dy, placement);
      const x = trace.x + offset.dx;
      const y = trace.y + offset.dy;
      const lines =
        brightness > 0
          ? [...trace.lines, { x1: trace.x, y1: trace.y, x2: x, y2: y, brightness }]
          : trace.lines;
      return { x, y, lines };
    },
    { x: placement.x, y: placement.y, lines: [] },
  ).lines;

/**
 * Where the beam ends after tracing `shape` at scale 1, relative to where it started. Fonts and
 * rows of icons use it: each glyph ends where the next one begins.
 */
export const shapeEnd = (shape: VectorShape): Offset =>
  shape.reduce<Offset>((end, [dx, dy]) => ({ dx: end.dx + dx, dy: end.dy + dy }), {
    dx: 0,
    dy: 0,
  });
