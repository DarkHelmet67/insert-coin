import { FIELD_WIDTH, movePoint, type Point } from './position';
import { nextRandom, type Rng } from './random';
import { growExplosion, type RockExplosion } from './rocks';
import { smallSaucerShot } from './saucer-aim';
import { addShot, shotFrom, type ShotSlots } from './shots';

/** The two saucers [P $021C]: the large one shoots at random, the small one aims. */
export type SaucerSize = 'large' | 'small';

/** A flying saucer crossing the screen. */
export interface Saucer {
  readonly kind: 'saucer';
  readonly position: Point;
  /** Velocity in position units per frame: ±16 across, -16, 0 or +16 up and down. */
  readonly vx: number;
  readonly vy: number;
  readonly size: SaucerSize;
}

/** The saucer slot: a saucer, its explosion (the same cloud as a rock) or free. */
export type SaucerSlot = Saucer | RockExplosion | null;

/** Everything about the saucers, with the program's timers [P $02F7-$02FD]. */
export interface SaucerState {
  readonly saucer: SaucerSlot;
  /** The saucer's two shot slots [P $021D]. */
  readonly saucerShots: ShotSlots;
  /**
   * Ticks of 4 frames before the next saucer, or, while a saucer flies, before its next shot
   * [P $02F7]: the program uses one timer for both.
   */
  readonly saucerTimer: number;
  /** What the timer restarts from when a saucer goes away; it shrinks with every saucer [P $02F8]. */
  readonly saucerReload: number;
  /** Ticks since the player last broke a rock, counting down from 80 [P $02F9]. */
  readonly rockHitTimer: number;
  /** A saucer comes early only with fewer rocks than this: 6 in the first wave, up to 10 [P $02FD]. */
  readonly saucerRockLimit: number;
}

/** The saucers at the start of a game [P $68F8-$6913]. */
export const noSaucer: SaucerState = {
  saucer: null,
  saucerShots: [null, null],
  saucerTimer: 0x92,
  saucerReload: 0x92,
  rockHitTimer: 0,
  saucerRockLimit: 5,
};

/** Horizontal speed of every saucer [P $6BFD]: it crosses the screen in about 8.5 seconds. */
export const SAUCER_SPEED = 16;

/** Ticks before a new saucer shoots for the first time [P $6BBC]: 72 frames. */
export const FIRST_SHOT_DELAY = 0x12;

/** Ticks between two shots of a saucer [P $6C54]: 40 frames. */
export const SHOT_INTERVAL = 0x0a;

/** Ticks a broken rock keeps the saucers polite [P $75EE]: 80 ticks, 320 frames. */
export const ROCK_HIT_MEMORY = 0x50;

/** Every saucer comes 6 ticks sooner than the last one, down to 32 ticks [P $6BD0]. */
const RELOAD_STEP = 6;
const MIN_RELOAD = 0x20;

/** Score from which every saucer is small [P $6C1E]. */
export const SMALL_SAUCER_SCORE = 30000;

/** New vertical speeds, picked every 128 frames [P $6CD3]: half the time straight on. */
const COURSES: readonly number[] = [-16, 0, 0, 16];

/** A new wave gives the player a longer pause before the first saucer [P $71D5]. */
export const WAVE_SAUCER_DELAY = 0x7f;

/** The waiting time before the next saucer, 6 ticks shorter unless already at the minimum. */
export const shorterReload = (reload: number): number =>
  reload - RELOAD_STEP < MIN_RELOAD ? reload : reload - RELOAD_STEP;

/**
 * Large or small [P $6C12-$6C30]: always large while the waiting time is long (the first three
 * saucers), always small from 30,000 points, otherwise large with a chance that falls as the
 * saucers come more often.
 */
export const saucerSize = (
  reload: number,
  score: number,
  rng: Rng,
): { readonly size: SaucerSize; readonly rng: Rng } => {
  if (reload >= 0x80) return { size: 'large', rng };
  if (score >= SMALL_SAUCER_SCORE) return { size: 'small', rng };
  const draw = nextRandom(rng);
  return { size: reload >> 1 >= draw.value ? 'large' : 'small', rng: draw.rng };
};

/**
 * A new saucer [P $6BDD-$6C0F]: on the left edge going right or on the right edge going left,
 * at a random height. The height comes from one random number: its top five bits are the
 * block of 256 units, its low three bits the fine position inside the block.
 */
export const newSaucer = (
  reload: number,
  score: number,
  rng: Rng,
): { readonly saucer: Saucer; readonly rng: Rng } => {
  const draw = nextRandom(rng);
  const block = draw.value >> 3;
  const y = ((block >= 0x18 ? block & 0x17 : block) << 8) | ((draw.value & 7) << 5);
  // The side is bit 6 of the generator's other byte, read right after the draw.
  const fromLeft = (draw.rng.hi & 0x40) !== 0;
  const { size, rng: next } = saucerSize(reload, score, draw.rng);
  return {
    saucer: {
      kind: 'saucer',
      position: { x: fromLeft ? 0 : FIELD_WIDTH - 1, y },
      vx: fromLeft ? SAUCER_SPEED : -SAUCER_SPEED,
      vy: 0,
      size,
    },
    rng: next,
  };
};

/**
 * One tick of the saucer countdown [P $6BAF-$6BDA]. When it runs out, a saucer comes only if the
 * player is not lurking: after a recent hit on a rock, it waits until fewer rocks are left
 * than the limit (but not zero). A player who stops shooting rocks gets a saucer anyway.
 */
export const countDownToSaucer = (
  state: SaucerState,
  rocks: number,
  score: number,
  rng: Rng,
): { readonly state: SaucerState; readonly rng: Rng } => {
  const rockHitTimer = Math.max(0, state.rockHitTimer - 1);
  const saucerTimer = state.saucerTimer - 1;
  if (saucerTimer > 0) return { state: { ...state, rockHitTimer, saucerTimer }, rng };
  const waiting = { ...state, rockHitTimer, saucerTimer: FIRST_SHOT_DELAY };
  if (rockHitTimer > 0 && (rocks === 0 || rocks >= state.saucerRockLimit)) {
    return { state: waiting, rng };
  }
  const saucerReload = shorterReload(state.saucerReload);
  const { saucer, rng: next } = newSaucer(saucerReload, score, rng);
  return { state: { ...waiting, saucer, saucerReload }, rng: next };
};

/** A new course every 128 frames [P $6C34]: up, down or straight on. */
export const steerSaucer = (saucer: Saucer, rng: Rng): { saucer: Saucer; rng: Rng } => {
  const draw = nextRandom(rng);
  return { saucer: { ...saucer, vy: COURSES[draw.value & 3] ?? 0 }, rng: draw.rng };
};

/** The saucer is gone: the countdown to the next one starts again [P $702D, $6F99]. */
export const saucerGone = <T extends SaucerState>(state: T): T => ({
  ...state,
  saucer: null,
  saucerTimer: state.saucerReload,
});

/**
 * One frame of the saucer slot [P $6FC7-$6FE9]: the saucer moves, and leaves when it reaches
 * the other side (it wraps only up and down); an explosion grows until it is over.
 */
export const moveSaucer = <T extends SaucerState>(state: T): T => {
  const { saucer } = state;
  if (!saucer) return state;
  if (saucer.kind === 'explosion') {
    const explosion = growExplosion(saucer);
    return explosion ? { ...state, saucer: explosion } : saucerGone(state);
  }
  const x = saucer.position.x + saucer.vx;
  if (x < 0 || x >= FIELD_WIDTH) return saucerGone(state);
  return {
    ...state,
    saucer: { ...saucer, position: movePoint(saucer.position, saucer.vx, saucer.vy) },
  };
};

/**
 * One tick of the saucer's gun [P $6C4E-$6CCC]: when the timer runs out the saucer shoots, the
 * large one in a random direction, the small one at `target` (the ship) with a random error.
 * With both shot slots taken the shot is lost, but the timer starts again anyway.
 */
export const saucerShoots = (
  state: SaucerState,
  target: Point,
  score: number,
  rng: Rng,
): { readonly state: SaucerState; readonly rng: Rng } => {
  const { saucer } = state;
  if (saucer?.kind !== 'saucer') return { state, rng };
  const saucerTimer = state.saucerTimer - 1;
  if (saucerTimer > 0) return { state: { ...state, saucerTimer }, rng };
  const draw = nextRandom(rng);
  const direction =
    saucer.size === 'large' ? draw.value : smallSaucerShot(saucer, target, draw.value, score);
  return {
    state: {
      ...state,
      saucerTimer: SHOT_INTERVAL,
      saucerShots: addShot(state.saucerShots, shotFrom({ ...saucer, direction })),
    },
    rng: draw.rng,
  };
};
