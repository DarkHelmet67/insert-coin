import {
  collides,
  SAUCER_REACH,
  SAUCER_SIZE,
  SHIP_REACH,
  SHIP_SIZE,
  TARGET_SIZE,
} from './collisions';
import { killShip, type PlayerState } from './player';
import type { Point } from './position';
import type { Rng } from './random';
import { EXPLOSION_START, type RockSlot } from './rocks';
import { ROCK_HIT_MEMORY, type SaucerState } from './saucer';
import { addPoints, earnsExtraLife, ROCK_POINTS, SAUCER_POINTS } from './score';
import type { ShotSlots } from './shots';
import { splitRock } from './split';

/** The part of the game that changes when objects meet. */
export interface HitState extends PlayerState, SaucerState {
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

/** Whether an object at `at` touches the flying ship. */
const hitsShip = (state: HitState, at: Point, reach: number): boolean =>
  state.life.kind === 'flying' && collides(state.ship.position, at, SHIP_SIZE + reach);

/** Whether a shot at `at` touches the flying saucer. */
const hitsSaucer = (state: HitState, at: Point): boolean =>
  state.saucer?.kind === 'saucer' &&
  collides(state.saucer.position, at, SAUCER_SIZE[state.saucer.size]);

/** Points for the player, with an extra ship at every 10,000 [P $7397]. */
const scorePoints = (state: HitState, points: number): HitState => {
  const score = addPoints(state.score, points);
  return { ...state, score, lives: state.lives + (earnsExtraLife(state.score, score) ? 1 : 0) };
};

/**
 * The rock in slot `index` breaks [P $75EC]. Its points go to the player only when the player
 * broke it; any broken rock makes the saucers wait a little longer.
 */
const breakRock = (state: HitState, index: number, scores: boolean): HitState => {
  const rock = state.rocks[index];
  if (rock?.kind !== 'rock') return state;
  const { slots, rng } = splitRock(state.rocks, index, state.rng);
  const broken = { ...state, rocks: slots, rng, rockHitTimer: ROCK_HIT_MEMORY };
  return scores ? scorePoints(broken, ROCK_POINTS[rock.size]) : broken;
};

/** The saucer explodes [P $6B29, $6B73]; its points go to the player only when the player hit it. */
const explodeSaucer = (state: HitState, scores: boolean): HitState => {
  const { saucer } = state;
  if (saucer?.kind !== 'saucer') return state;
  const exploded = {
    ...state,
    saucer: { kind: 'explosion', position: saucer.position, status: EXPLOSION_START } as const,
  };
  return scores ? scorePoints(exploded, SAUCER_POINTS[saucer.size]) : exploded;
};

/** The shot in slot `index` of `key` is spent. */
const spendShot = (state: HitState, key: 'shots' | 'saucerShots', index: number): HitState => ({
  ...state,
  [key]: state[key].map((old, i) => (i === index ? null : old)),
});

/**
 * One shot of the player [P $69FD]: it looks for the saucer, then the ship, then the rocks. A
 * shot that comes back around the screen can destroy its own ship, and scores nothing for it.
 */
const resolveShot = (state: HitState, index: number): HitState => {
  const shot = state.shots[index];
  if (!shot) return state;
  const spent = spendShot(state, 'shots', index);
  if (hitsSaucer(state, shot.position)) return explodeSaucer(spent, true);
  if (hitsShip(state, shot.position, 0)) return { ...spent, ...killShip(spent) };
  const target = rockHitBy(shot.position, 0, state.rocks);
  return target < 0 ? state : breakRock(spent, target, true);
};

/** One shot of the saucer: it looks for the ship, then the rocks, which break for no points. */
const resolveSaucerShot = (state: HitState, index: number): HitState => {
  const shot = state.saucerShots[index];
  if (!shot) return state;
  const spent = spendShot(state, 'saucerShots', index);
  if (hitsShip(state, shot.position, 0)) return { ...spent, ...killShip(spent) };
  const target = rockHitBy(shot.position, 0, state.rocks);
  return target < 0 ? state : breakRock(spent, target, false);
};

/**
 * The saucer against the ship and the rocks [P $6B0F]: running into the ship destroys both and
 * gives the player the saucer's points; running into a rock destroys both for no points.
 */
const resolveSaucer = (state: HitState): HitState => {
  const { saucer } = state;
  if (saucer?.kind !== 'saucer') return state;
  const reach = SAUCER_REACH[saucer.size];
  if (hitsShip(state, saucer.position, reach)) {
    return explodeSaucer({ ...state, ...killShip(state) }, true);
  }
  const target = rockHitBy(saucer.position, reach, state.rocks);
  return target < 0 ? state : breakRock(explodeSaucer(state, false), target, false);
};

/** The ship against the rocks [P $6B1E]: both are destroyed, and the rock still scores. */
const resolveShip = (state: HitState): HitState => {
  if (state.life.kind !== 'flying') return state;
  const target = rockHitBy(state.ship.position, SHIP_REACH, state.rocks);
  return target < 0 ? state : breakRock({ ...state, ...killShip(state) }, target, true);
};

/**
 * Every collision of one frame, in the order of the program [P $69F0]: the player's shots from
 * the last slot down, the saucer's shots, the saucer, then the ship. Each object hits at most one
 * thing, and a rock broken by one shot is already an explosion for the next.
 */
export const resolveHits = (state: HitState): HitState =>
  resolveShip(
    resolveSaucer([1, 0].reduce(resolveSaucerShot, [3, 2, 1, 0].reduce(resolveShot, state))),
  );
