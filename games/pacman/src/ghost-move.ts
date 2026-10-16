import {
  addPoints,
  directionStep,
  isCentered,
  isTunnelTile,
  oppositeDirection,
  tileAddress,
  tileOf,
  type Point,
} from './geometry';
import { GHOST, type Ghost } from './ghosts';
import { COLOR } from './maze';
import { tickSpeed, type SpeedPattern } from './speed';

/** Blinky's extra speeds, when few dots are left ($4D4E, $4D52). */
export interface ElroySpeeds {
  readonly elroy1: SpeedPattern;
  readonly elroy2: SpeedPattern;
}

/** Which Cruise Elroy Blinky is in ($4DB6, $4DB7). */
export interface ElroyState {
  readonly elroy1: boolean;
  readonly elroy2: boolean;
}

/** The decision a ghost asks for when it reaches the middle of a tile. */
export type Decision = 'target' | 'random';

/** What happened to a ghost in one update. */
export interface GhostMove {
  readonly ghost: Ghost;
  readonly elroySpeeds: ElroySpeeds;
  /** The way out of its new next tile is to be chosen after this frame's updates. */
  readonly decision?: Decision;
}

/** A ghost's pixel in the maze, and the decision it asks for, if any. */
export interface GhostStep {
  readonly ghost: Ghost;
  readonly decision?: Decision;
}

/** The speed pattern a ghost uses now, with a function to store it back once turned. */
interface SpeedSlot {
  readonly pattern: SpeedPattern;
  readonly store: (move: GhostMove, pattern: SpeedPattern) => GhostMove;
}

/**
 * The speed of a ghost ($1B43-$1BD7): slowed down in the tunnels (color $1B under it), then
 * blue, then for Blinky the two Cruise Elroy speeds, then normal.
 */
const speedSlot = (
  ghost: Ghost,
  colors: readonly number[],
  elroy: ElroyState,
  elroySpeeds: ElroySpeeds,
): SpeedSlot => {
  /** A slot among the ghost's own patterns. */
  const own = (key: keyof Ghost['speeds']): SpeedSlot => ({
    pattern: ghost.speeds[key],
    store: (move, pattern) => ({
      ...move,
      ghost: { ...move.ghost, speeds: { ...move.ghost.speeds, [key]: pattern } },
    }),
  });
  /** A slot among Blinky's Elroy patterns. */
  const cruise = (key: keyof ElroySpeeds): SpeedSlot => ({
    pattern: elroySpeeds[key],
    store: (move, pattern) => ({ ...move, elroySpeeds: { ...move.elroySpeeds, [key]: pattern } }),
  });
  if (colors[tileAddress(ghost.tile)] === COLOR.tunnel) return own('tunnel');
  if (ghost.blue) return own('fright');
  if (ghost.id === GHOST.blinky && elroy.elroy2) return cruise('elroy2');
  if (ghost.id === GHOST.blinky && elroy.elroy1) return cruise('elroy1');
  return own('normal');
};

/**
 * The tunnel ends meet (routine $1ED0): a next tile past one end becomes the tile at the other.
 */
const wrapTunnel = (tile: Point): Point => {
  if (tile.x === 0x1d) return { ...tile, x: 0x3d };
  if (tile.x === 0x3e) return { ...tile, x: 0x1e };
  return tile;
};

/**
 * At the middle of a tile ($1BF7-$1C33): ask for the way out of the next tile, unless that
 * tile is in a tunnel or the ghost is in a zone where it may not turn up (color $1A); turn
 * around if a reversal is pending; then enter the next tile.
 */
const atTileCenter = (ghost: Ghost, colors: readonly number[]): GhostStep => {
  const nextTile = wrapTunnel(ghost.nextTile);
  const decision: Decision | undefined = isTunnelTile(nextTile)
    ? undefined
    : ghost.blue
      ? 'random'
      : colors[tileAddress(nextTile)] === COLOR.noUp
        ? undefined
        : 'target';
  const nextOrientation = ghost.reverse
    ? oppositeDirection(ghost.orientation)
    : ghost.nextOrientation;
  const nextStep = ghost.reverse ? directionStep(nextOrientation) : ghost.nextStep;
  return {
    ghost: {
      ...ghost,
      reverse: false,
      nextTile: addPoints(nextTile, nextStep),
      step: nextStep,
      nextStep,
      orientation: nextOrientation,
      nextOrientation,
    },
    ...(decision === undefined ? {} : { decision }),
  };
};

/** Whether the ghost is at the middle of its tile along the way it goes ($1BD8). */
const centered = (ghost: Ghost): boolean =>
  isCentered(ghost.step.y !== 0 ? ghost.position.y : ghost.position.x);

/**
 * One pixel of a ghost in the maze ($1BD8): choose at the middle of a tile, then move. The
 * eyes of an eaten ghost go this way at every update, without a speed pattern.
 */
export const stepGhost = (ghost: Ghost, colors: readonly number[]): GhostStep => {
  const turned = centered(ghost) ? atTileCenter(ghost, colors) : { ghost };
  const position = addPoints(turned.ghost.position, turned.ghost.step);
  return { ...turned, ghost: { ...turned.ghost, position, tile: tileOf(position) } };
};

/**
 * One update of a ghost roaming the maze (routines $1B36, $1C4B, $1D22, $1DF9): take the next
 * bit of its speed and, if it says so, move one pixel.
 */
export const updateGhost = (
  ghost: Ghost,
  colors: readonly number[],
  elroy: ElroyState,
  elroySpeeds: ElroySpeeds,
): GhostMove => {
  const unchanged: GhostMove = { ghost, elroySpeeds };
  if (ghost.house !== 'out' || ghost.eyes !== 'alive') return unchanged;
  const slot = speedSlot(ghost, colors, elroy, elroySpeeds);
  const tick = tickSpeed(slot.pattern);
  const ticked = slot.store(unchanged, tick.pattern);
  return tick.move ? { ...ticked, ...stepGhost(ticked.ghost, colors) } : ticked;
};
