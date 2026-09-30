import { collides, SHIP_REACH, SHIP_SIZE, TARGET_SIZE } from './collisions';
import { killShip, type PlayerState } from './player';
import type { Point } from './position';
import type { Rng } from './random';
import type { RockSlot } from './rocks';
import { addPoints, earnsExtraLife, ROCK_POINTS } from './score';
import type { ShotSlots } from './shots';
import { splitRock } from './split';

/** The part of the game that changes when objects meet. */
export interface HitState extends PlayerState {
  readonly shots: ShotSlots;
  readonly rocks: readonly RockSlot[];
  readonly score: number;
  readonly rng: Rng;
}

/**
 * The first rock touched by an object at `at`, searching from the last slot down as the program
 * does [P $6A0A], or -1. `reach` is what the object adds to the size of the rock.
 */
export const rockHitBy = (at: Point, reach: number, rocks: readonly RockSlot[]): number => {
  /** Searches down from `index` for a rock the object touches. */
  const hit = (index: number): number => {
    if (index < 0) return -1;
    const slot = rocks[index];
    return slot?.kind === 'rock' && collides(slot.position, at, TARGET_SIZE[slot.size] + reach)
      ? index
      : hit(index - 1);
  };
  return hit(rocks.length - 1);
};

/** Points for the player, with an extra ship at every 10,000 [P $7397]. */
const scorePoints = (state: HitState, points: number): HitState => {
  const score = addPoints(state.score, points);
  return { ...state, score, lives: state.lives + (earnsExtraLife(state.score, score) ? 1 : 0) };
};

/** The rock in slot `index` breaks, and the player scores its points [P $75EC]. */
const breakRock = (state: HitState, index: number): HitState => {
  const rock = state.rocks[index];
  if (rock?.kind !== 'rock') return state;
  const { slots, rng } = splitRock(state.rocks, index, state.rng);
  return scorePoints({ ...state, rocks: slots, rng }, ROCK_POINTS[rock.size]);
};

/**
 * One shot of the player [P $69FD]: it looks first for the ship, then for the rocks. A shot
 * that comes back around the screen can destroy its own ship, and scores nothing for it.
 */
const resolveShot = (state: HitState, index: number): HitState => {
  const shot = state.shots[index];
  if (!shot) return state;
  const spent = { ...state, shots: state.shots.map((old, i) => (i === index ? null : old)) };
  if (state.life.kind === 'flying' && collides(state.ship.position, shot.position, SHIP_SIZE)) {
    return { ...spent, ...killShip(spent) };
  }
  const target = rockHitBy(shot.position, 0, state.rocks);
  return target < 0 ? state : breakRock(spent, target);
};

/** The ship against the rocks [P $6B1E]: both are destroyed, and the rock still scores. */
const resolveShip = (state: HitState): HitState => {
  if (state.life.kind !== 'flying') return state;
  const target = rockHitBy(state.ship.position, SHIP_REACH, state.rocks);
  return target < 0 ? state : breakRock({ ...state, ...killShip(state) }, target);
};

/**
 * Every collision of one frame, in the order of the program [P $69F0]: the shots from the last
 * slot down, then the ship. Each object hits at most one thing, and a rock broken by one shot is
 * already an explosion for the next.
 */
export const resolveHits = (state: HitState): HitState =>
  resolveShip([3, 2, 1, 0].reduce(resolveShot, state));
