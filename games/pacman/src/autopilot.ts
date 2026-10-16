import {
  addPoints,
  directionStep,
  isCentered,
  isTunnelTile,
  oppositeDirection,
  tileOf,
  type Point,
} from './geometry';
import { chooseToward } from './ghost-ai';
import { wrapTunnel } from './ghost-move';
import { tickPacMan, type PacMan, type PacManMove } from './pacman';

/**
 * Pac-Man without a player: in the demo game and in the intermissions the program drives him
 * like a ghost (routine $1A19). At the middle of each tile he enters the tile ahead, already
 * chosen, and asks for the way out of the next one; nothing checks the walls while he moves.
 */

/** What happened to Pac-Man in one update, and whether he asks for his next way out (task $17). */
export interface AutoMove extends PacManMove {
  readonly decides: boolean;
}

/** Whether Pac-Man is at the middle of his tile along the way he goes ($1A19-$1A35). */
const centered = (pacman: PacMan): boolean =>
  isCentered(pacman.step.y !== 0 ? pacman.position.y : pacman.position.x);

/**
 * At the middle of a tile ($1A38-$1A59): the tile ahead wraps round at the tunnel ends, and
 * outside the tunnels he asks for a decision; then he enters it along the direction he wants.
 */
const atTileCenter = (pacman: PacMan): { readonly pacman: PacMan; readonly decides: boolean } => {
  const ahead = wrapTunnel(pacman.nextTile);
  const step = directionStep(pacman.wanted);
  return {
    pacman: {
      ...pacman,
      nextTile: addPoints(ahead, step),
      step,
      orientation: pacman.wanted,
    },
    decides: !isTunnelTile(ahead),
  };
};

/** One update of Pac-Man driven by the program: his speed, then one pixel ($1A5C). */
export const updateAutoPacMan = (pacman: PacMan, frightened: boolean): AutoMove => {
  const tick = tickPacMan(pacman, frightened);
  if (!tick.move)
    return { pacman: tick.pacman, canEat: false, active: tick.active, decides: false };
  const turned = centered(tick.pacman)
    ? atTileCenter(tick.pacman)
    : { pacman: tick.pacman, decides: false };
  const position = addPoints(turned.pacman.position, turned.pacman.step);
  return {
    pacman: { ...turned.pacman, position, tile: tileOf(position) },
    canEat: !isTunnelTile(pacman.tile),
    active: true,
    decides: turned.decides,
  };
};

/** Where the demo steers Pac-Man (task $17 at $28E3), from Pinky's tile ahead. */
export interface DemoTargets {
  readonly pinkyTile: Point;
  /** Blinky is blue, so it is time to chase the ghosts instead of running. */
  readonly blinkyBlue: boolean;
}

/**
 * The demo's target ($28E3): while Blinky is blue, Pinky's tile ahead; otherwise the tile on
 * the far side of Pac-Man from it, so he runs away from Pinky.
 */
export const demoTarget = (pacman: PacMan, targets: DemoTargets): Point =>
  targets.blinkyBlue
    ? targets.pinkyTile
    : {
        x: (2 * pacman.tile.x - targets.pinkyTile.x) & 0xff,
        y: (2 * pacman.tile.y - targets.pinkyTile.y) & 0xff,
      };

/** Pac-Man's way out of the tile ahead, toward the demo's target, as a ghost would choose it. */
export const decidePacMan = (
  pacman: PacMan,
  targets: DemoTargets,
  tiles: readonly number[],
): PacMan => {
  const choice = chooseToward(pacman.nextTile, pacman.wanted, demoTarget(pacman, targets), tiles);
  return { ...pacman, wanted: choice.direction };
};

/**
 * Pac-Man turns back after an energizer in the attract mode (routine $05A5): he will take the
 * other way at the middle of his next tile.
 */
export const reversePacMan = (pacman: PacMan): PacMan => ({
  ...pacman,
  wanted: oppositeDirection(pacman.orientation),
});

/** Pac-Man turns back at once, as in the first intermission ($215D-$2166). */
export const turnPacManNow = (pacman: PacMan): PacMan => {
  const wanted = oppositeDirection(pacman.orientation);
  return { ...pacman, wanted, orientation: wanted, step: directionStep(wanted) };
};
