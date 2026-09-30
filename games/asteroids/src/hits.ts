import { collides, TARGET_SIZE } from './collisions';
import type { Rng } from './random';
import type { RockSlot } from './rocks';
import { addPoints, ROCK_POINTS } from './score';
import type { Shot, ShotSlots } from './shots';
import { splitRock } from './split';

/** The part of the game that shots and rocks change when they meet. */
export interface HitState {
  readonly shots: ShotSlots;
  readonly rocks: readonly RockSlot[];
  readonly score: number;
  readonly rng: Rng;
}

/**
 * The first rock a shot touches, searching from the last slot down as the program does
 * [P $6A0A], or -1.
 */
export const rockHitBy = (shot: Shot, rocks: readonly RockSlot[]): number => {
  /** Searches down from `index` for a rock the shot touches. */
  const hit = (index: number): number => {
    if (index < 0) return -1;
    const slot = rocks[index];
    return slot?.kind === 'rock' && collides(slot.position, shot.position, TARGET_SIZE[slot.size])
      ? index
      : hit(index - 1);
  };
  return hit(rocks.length - 1);
};

/** One shot against the rocks: on a hit the shot disappears, the rock breaks, the score grows. */
const resolveShot = (state: HitState, index: number): HitState => {
  const shot = state.shots[index];
  if (!shot) return state;
  const target = rockHitBy(shot, state.rocks);
  const rock = state.rocks[target];
  if (rock?.kind !== 'rock') return state;
  const { slots, rng } = splitRock(state.rocks, target, state.rng);
  return {
    shots: state.shots.map((old, i) => (i === index ? null : old)),
    rocks: slots,
    score: addPoints(state.score, ROCK_POINTS[rock.size]),
    rng,
  };
};

/**
 * Every shot against the rocks, from the last shot slot down [P $69F0]. Each shot hits at most
 * one rock, and a rock broken by one shot is already an explosion for the next.
 */
export const shotsHitRocks = (state: HitState): HitState => [3, 2, 1, 0].reduce(resolveShot, state);
