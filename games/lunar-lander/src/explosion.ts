import { shapeEnd, shapeToLines, type BeamLine, type VectorShape } from '@arcade/vector';
import { CABINS } from './module-shapes';

/**
 * The crash [P BOOM, DELTA; R PIECE1-PIEC12, OCTX0-OCTX7]: six pieces of debris and the cabin fly
 * away from the wreck along fixed directions, one of four sets picked at random, while the cabin
 * spins. See docs/meccaniche-originali.md, section 6.
 */

/** Brightness of the debris [R .PIEC]. */
const PIECE = 10;

/** The 12 debris drawings of the ROM [R PIECE1-PIECE6, PIEC7-PIEC12]. */
const PIECES: readonly VectorShape[] = [
  [
    [-4, 0, PIECE],
    [2, 0, 0],
    [4, 8, PIECE],
    [-2, -8, 0],
  ],
  [
    [-5, 0, PIECE],
    [0, -3, PIECE],
    [11, 0, PIECE],
    [-6, 3, 0],
  ],
  [
    [-6, 0, PIECE],
    [3, 6, PIECE],
    [3, -6, 0],
  ],
  [
    [7, 0, PIECE],
    [-3, 6, PIECE],
    [-4, -6, 0],
  ],
  [
    [4, 0, PIECE],
    [0, 3, PIECE],
    [-10, 0, PIECE],
    [6, -3, 0],
  ],
  [
    [4, 0, PIECE],
    [-2, 0, 0],
    [-4, 8, PIECE],
    [2, -8, 0],
  ],
  [
    [0, 2, PIECE],
    [2, 0, PIECE],
    [0, -2, PIECE],
    [-2, 0, PIECE],
  ],
  [
    [-3, -6, PIECE],
    [13, 0, PIECE],
    [-3, 6, PIECE],
    [-5, -2, PIECE],
    [-2, 1, PIECE],
  ],
  [
    [0, 3, PIECE],
    [14, 0, PIECE],
    [0, -3, PIECE],
    [-14, 0, PIECE],
  ],
  [
    [-2, 2, PIECE],
    [1, -1, 0],
    [8, 4, PIECE],
    [-7, -5, 0],
  ],
  [
    [2, 2, PIECE],
    [-1, -1, 0],
    [-8, 3, PIECE],
    [-7, -4, 0],
  ],
  [
    [3, 3, PIECE],
    [3, -3, PIECE],
    [-3, -3, PIECE],
    [-3, 3, PIECE],
  ],
];

/** The four sets of debris, by number in PIECES [R BOOMB1-BOOMB4]. */
const DEBRIS_SETS: readonly (readonly number[])[] = [
  [0, 1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10, 11],
  [2, 11, 8, 5, 3, 11],
  [7, 1, 2, 9, 5, 6],
];

/** Direction of each piece, then of the cabin, for each set [P BOOMA1-BOOMA4]. */
const DIRECTIONS: readonly (readonly (readonly [number, number])[])[] = [
  [
    [0, -2],
    [-1, -1],
    [-2, 0],
    [-1, 0],
    [0, 2],
    [2, -1],
    [0, 3],
  ],
  [
    [2, 1],
    [0, 1],
    [-4, 1],
    [-1, -1],
    [2, 0],
    [0, -1],
    [0, 2],
  ],
  [
    [-1, 0],
    [-3, 0],
    [1, 0],
    [-1, -1],
    [0, -1],
    [3, 0],
    [0, 3],
  ],
  [
    [1, -1],
    [-5, 0],
    [1, -1],
    [3, 1],
    [-1, -3],
    [1, 1],
    [0, 3],
  ],
];

/** Step after which each piece, then the cabin, disappears [P BOOMC1]. */
const LIFETIMES: readonly number[] = [0x5d, 0x60, 0x64, 0x6d, 0x70, 0x74, 0x7f];

/** The move that brings the beam back to the start of each spinning cabin [R OCTX0-OCTX7]. */
const CABIN_RETURN: readonly (readonly [number, number])[] = [
  [2, 7],
  [1, 8],
  [0, 9],
  [-2, 8],
  [4, 8],
  [3, 8],
  [1, 8],
  [-1, 8],
];

/** The spinning cabin of explosion step `step` [R OCTGN: one of 8 octagons]. */
const cabinShape = (step: number): VectorShape => {
  const turn = step & 7;
  const [dx, dy] = CABIN_RETURN[turn] ?? [0, 0];
  return [...(CABINS[turn] ?? []), [dx, dy, 0]];
};

/** Longest blank move the program draws: beyond it the rest of the debris is left out [P BOOM]. */
const MAX_MOVE = 1023;

/** How the crash looks: chosen when the module hits the surface [P DELTA]. */
export interface Explosion {
  /** Set of debris and of crash message, 0 to 3. */
  readonly set: number;
  /** Extra speed of the cabin, from the speed of the module (-7 to 7, 0 to 7). */
  readonly cabinX: number;
  readonly cabinY: number;
}

/**
 * The explosion of a module hitting the ground with speeds `vx`, `vy` [P DELTA]: the cabin is
 * thrown up as fast as the module fell, and back against its horizontal motion.
 */
export const explosionFor = (vx: number, vy: number, random: number): Explosion => {
  const across = Math.min(7, Math.abs(vx) >> 10);
  return {
    set: (random >> 2) & 3,
    cabinX: vx >= 0 && across > 0 ? -across : across,
    cabinY: Math.min(7, Math.abs(vy) >> 11),
  };
};

/** One step of the beam's walk: the move to the next piece, and the piece. */
interface Flight {
  readonly dx: number;
  readonly dy: number;
  readonly shape: VectorShape;
}

/** The pieces still in the air at `step`, cabin first, as the program walks them [P BOOM]. */
const flyingPieces = (explosion: Explosion, step: number): readonly Flight[] => {
  const directions = DIRECTIONS[explosion.set] ?? DIRECTIONS[0] ?? [];
  const debris = DEBRIS_SETS[explosion.set] ?? DEBRIS_SETS[0] ?? [];
  return [6, 5, 4, 3, 2, 1, 0]
    .filter((piece) => step <= (LIFETIMES[piece] ?? 0))
    .map((piece) => {
      const [x, y] = directions[piece] ?? [0, 0];
      const cabin = piece === 6;
      return {
        dx: (x + (cabin ? explosion.cabinX : 0)) * step,
        dy: (y + (cabin ? explosion.cabinY : 0)) * step,
        shape: cabin ? cabinShape(step) : (PIECES[debris[piece] ?? 0] ?? []),
      };
    });
};

/**
 * The lines of the explosion at `step` (1 to 127), around the wreck at (`x`, `y`). Each piece is
 * placed from where the previous one left the beam, as in the vector list of the program, and the
 * walk stops at the first move longer than the screen.
 */
export const explosionLines = (
  explosion: Explosion,
  step: number,
  x: number,
  y: number,
): readonly BeamLine[] => {
  const pieces = flyingPieces(explosion, step);
  const stop = pieces.findIndex(
    (piece) => Math.abs(piece.dx) > MAX_MOVE || Math.abs(piece.dy) > MAX_MOVE,
  );
  const shown = stop === -1 ? pieces : pieces.slice(0, stop);
  return shown.reduce<{
    readonly x: number;
    readonly y: number;
    readonly lines: readonly BeamLine[];
  }>(
    (beam, piece) => {
      const start = { x: beam.x + piece.dx, y: beam.y + piece.dy };
      const end = shapeEnd(piece.shape);
      return {
        x: start.x + end.dx,
        y: start.y + end.dy,
        lines: [...beam.lines, ...shapeToLines(piece.shape, start)],
      };
    },
    { x, y, lines: [] },
  ).lines;
};

/** Volume of the explosion noise, 0 to 15: loud at first, fading out by step 64 [P BOOM 35$]. */
export const explosionVolume = (step: number): number => {
  const left = (step ^ 0x7f) & 0x7f;
  return left < 0x40 ? 0 : left >> 3;
};
