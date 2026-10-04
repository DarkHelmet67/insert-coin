import { shapeEnd, shapeToLines, type BeamLine, type Offset } from '@arcade/vector';
import { moduleShape, moduleView, type ModuleSize, type Orientation } from './module-view';

/**
 * Half of the base of the engine bell, for each ROM drawing [P FLAMEA, FLAMEB]: the flame starts
 * at the end of the module drawing and its base goes twice this far.
 */
const BELL_HALF_BASE: Readonly<Record<ModuleSize, readonly (readonly [number, number])[]>> = {
  large: [
    [0, -7],
    [2, -6],
    [3, -6],
    [4, -5],
    [5, -5],
    [6, -4],
    [6, -3],
    [7, -2],
    [7, 0],
  ],
  small: [
    [0, -4],
    [1, -4],
    [1, -4],
    [2, -3],
    [3, -3],
    [3, -2],
    [4, -1],
    [4, -1],
    [4, 0],
  ],
};

/** Thrust level of the ABORT button: one above the lever's maximum [P ABORT]. */
export const ABORT_THRUST = 16;

/**
 * How far the flame reaches, in multiples of the half base [P FLAME, FLMFRC]: the thrust times
 * 0x74 / 256 (0 to 7), one more on odd frames so the flame flickers.
 */
export const flameLength = (thrust: number, frame: number): number =>
  ((thrust * 0x74) >> 8) + (frame % 2);

/**
 * Brightness of the flame [P FLAME]: 8 plus half the thrust, the maximum (15) for the ABORT.
 */
export const flameBrightness = (thrust: number): number =>
  thrust >= ABORT_THRUST ? 15 : 8 + (thrust >> 1);

/**
 * The flame under the engine, in the ROM drawing's own frame: two lines from the left corner of
 * the bell out to the tip and back to the right corner. The tip lies `length` half bases away
 * from the base, on the side away from the cabin.
 */
export const flameShape = (
  size: ModuleSize,
  drawing: number,
  length: number,
  brightness: number,
): readonly (readonly [number, number, number])[] => {
  const [bx, by] = BELL_HALF_BASE[size][drawing] ?? [0, 0];
  // (by, -bx) is the half base turned a quarter clockwise: away from the cabin.
  const out: Offset = { dx: by * length, dy: -bx * length };
  return [
    [bx + out.dx, by + out.dy, brightness],
    [bx - out.dx, by - out.dy, brightness],
  ];
};

/** Where and how the module is drawn. */
export interface ModuleDrawing {
  readonly x: number;
  readonly y: number;
  readonly size: ModuleSize;
  readonly orientation: Orientation;
  /** Thrust level 0-15, or ABORT_THRUST. */
  readonly thrust: number;
  /** Frame counter, for the flicker of the flame. */
  readonly frame: number;
}

/** The module's lines, flame included, at a screen position. */
export const moduleLines = (module: ModuleDrawing): readonly BeamLine[] => {
  const { drawing, flipX, flipY } = moduleView(module.orientation);
  const shape = moduleShape(module.size, drawing);
  const placement = { x: module.x, y: module.y, flipX, flipY };
  if (module.thrust === 0) return shapeToLines(shape, placement);
  const flame = flameShape(
    module.size,
    drawing,
    flameLength(module.thrust, module.frame),
    flameBrightness(module.thrust),
  );
  // The flame continues from where the drawing leaves the beam: the left corner of the bell.
  return shapeToLines([...shape, ...flame], placement);
};

/** The end of a drawing, exported for the tests: where the flame begins. */
export const drawingEnd = (size: ModuleSize, drawing: number): Offset =>
  shapeEnd(moduleShape(size, drawing));
