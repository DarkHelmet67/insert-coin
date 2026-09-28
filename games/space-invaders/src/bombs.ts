import { alienWidth, type Alien } from './aliens';
import type { BombKind } from './sprites';

/** A bomb dropped by an invader. */
export interface Bomb {
  readonly kind: BombKind;
  /** Top-left corner of the 3×8 sprite, in screen pixels. */
  readonly x: number;
  readonly y: number;
  /** Steps taken since it was dropped: drives the animation and the reload rule. */
  readonly steps: number;
}

/** The invaders' bombs: at most one of each kind on screen. */
export interface BombsState {
  readonly active: readonly Bomb[];
  /** Frame counter: each frame handles one kind, so every bomb moves once every 3 frames. */
  readonly turn: number;
  /** Position in the column tables of the plunger and squiggly bombs. */
  readonly plungerIndex: number;
  readonly squigglyIndex: number;
}

/** What the bombs need to know about the rest of the game in this frame. */
export interface BombContext {
  readonly aliens: readonly Alien[];
  /** Horizontal center of the player's cannon. */
  readonly cannonCenterX: number;
  readonly score: number;
}

/** The order in which the three kinds take turns, one per frame. */
export const BOMB_KINDS: readonly BombKind[] = ['rolling', 'plunger', 'squiggly'];

/**
 * Columns (1-11) that drop plunger and squiggly bombs, in order. Squiggly bombs read the same
 * sequence starting further on (11, 1, 6, 3, ...), as documented for the original.
 */
export const COLUMN_FIRE_TABLE: readonly number[] = [
  1, 7, 1, 1, 1, 4, 11, 1, 6, 3, 1, 1, 11, 9, 2, 8, 2, 11, 4, 7, 10,
];
export const PLUNGER_TABLE = COLUMN_FIRE_TABLE.slice(0, 16);
export const SQUIGGLY_TABLE = COLUMN_FIRE_TABLE.slice(6);

/** Pixels a bomb falls at each of its steps: 4, or 5 when 8 invaders or fewer are left. */
export const bombSpeed = (aliensLeft: number): number => (aliensLeft <= 8 ? 5 : 4);

/**
 * How many steps the bombs already falling must have taken before a new one can drop.
 * The better the player, the faster the invaders reload (thresholds from the original).
 */
export const reloadSteps = (score: number): number => {
  if (score < 200) return 48;
  if (score < 1000) return 16;
  if (score < 2000) return 11;
  if (score < 3000) return 8;
  return 7;
};

/** No bombs on screen. */
export const initialBombsState: BombsState = {
  active: [],
  turn: 0,
  plungerIndex: 0,
  squigglyIndex: 0,
};

/** The lowest invader of a column, the one that drops the bombs. */
export const lowestInColumn = (aliens: readonly Alien[], column: number): Alien | undefined =>
  aliens
    .filter((alien) => alien.column === column)
    .reduce<Alien | undefined>((low, alien) => (!low || alien.y > low.y ? alien : low), undefined);

/** The column right above the cannon: the rolling bomb aims at the player. */
export const columnAbove = (aliens: readonly Alien[], x: number): number | undefined =>
  aliens.find((alien) => x >= alien.x && x < alien.x + alienWidth(alien))?.column;

/** A new bomb leaving the bottom center of `alien`. */
const dropFrom = (kind: BombKind, alien: Alien): Bomb => ({
  kind,
  x: alien.x + Math.floor(alienWidth(alien) / 2) - 1,
  y: alien.y + 8,
  steps: 0,
});

/** Which column the bomb of `kind` would come from, and the table positions after this attempt. */
const pickColumn = (
  state: BombsState,
  kind: BombKind,
  context: BombContext,
): { readonly column: number | undefined; readonly state: BombsState } => {
  switch (kind) {
    case 'rolling':
      return { column: columnAbove(context.aliens, context.cannonCenterX), state };
    case 'plunger':
      return {
        column: PLUNGER_TABLE[state.plungerIndex],
        state: { ...state, plungerIndex: (state.plungerIndex + 1) % PLUNGER_TABLE.length },
      };
    case 'squiggly':
      return {
        column: SQUIGGLY_TABLE[state.squigglyIndex],
        state: { ...state, squigglyIndex: (state.squigglyIndex + 1) % SQUIGGLY_TABLE.length },
      };
  }
};

/** Whether a new bomb may drop: the others have fallen far enough, and plungers stop with one invader left. */
const canDrop = (state: BombsState, kind: BombKind, context: BombContext): boolean =>
  state.active.every((bomb) => bomb.steps >= reloadSteps(context.score)) &&
  !(kind === 'plunger' && context.aliens.length <= 1);

/** Tries to drop a bomb of `kind` from the column chosen by its rule. */
const tryDrop = (state: BombsState, kind: BombKind, context: BombContext): BombsState => {
  if (!canDrop(state, kind, context)) return state;
  const picked = pickColumn(state, kind, context);
  const shooter =
    picked.column === undefined ? undefined : lowestInColumn(context.aliens, picked.column);
  return shooter
    ? { ...picked.state, active: [...picked.state.active, dropFrom(kind, shooter)] }
    : picked.state;
};

/** Moves a bomb one step down. */
const fall = (bomb: Bomb, aliensLeft: number): Bomb => ({
  ...bomb,
  y: bomb.y + bombSpeed(aliensLeft),
  steps: bomb.steps + 1,
});

/** Advances the bombs by one frame: the kind whose turn it is either falls or tries to drop. */
export const stepBombs = (state: BombsState, context: BombContext): BombsState => {
  const kind = BOMB_KINDS[state.turn % BOMB_KINDS.length] ?? 'rolling';
  const next = { ...state, turn: state.turn + 1 };
  const falling = next.active.find((bomb) => bomb.kind === kind);
  if (!falling) return tryDrop(next, kind, context);
  return {
    ...next,
    active: next.active.map((bomb) =>
      bomb === falling ? fall(bomb, context.aliens.length) : bomb,
    ),
  };
};

/** Removes the given bombs, e.g. after they hit something. */
export const removeBombs = (state: BombsState, hit: readonly Bomb[]): BombsState => ({
  ...state,
  active: state.active.filter((bomb) => !hit.includes(bomb)),
});
