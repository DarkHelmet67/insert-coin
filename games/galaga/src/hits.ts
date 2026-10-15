/*
 * The collisions, checked by the second processor (`hitd_det_rckt`, `hitd_det_fghtr`,
 * `hitd_dspchr`): rockets against the aliens, the fighter against aliens and bombs. A hit does
 * not destroy anything at once: it raises a notification that the main processor turns into an
 * explosion (`f_1DB3`), and adds to the hit counters that the score routine converts to points.
 */
import type { Attacks } from './attacks';
import { withTasks, type Capture } from './capture-state';
import type { FlightSlot } from './flight-slot';
import {
  DISPOSITION,
  ENEMY_OBJECTS,
  FIGHTER,
  FIGHTER_2,
  FIRST_BOMB,
  BOMB_COUNT,
  objectAt,
  ROCKETS,
  updateObject,
  type GameObject,
  type Objects,
} from './objects';
import type { SoundName } from './sound-names';
import type { ChallengeBonus } from './stage-setup';

/** Everything a hit can change. */
export interface HitWorld {
  readonly objects: Objects;
  readonly slots: readonly (FlightSlot | undefined)[];
  /** Hits by palette, waiting to become points (`ds_bug_collsn_hit_mult`). */
  readonly hitCounts: readonly number[];
  /** Rockets that hit something, for the results (`_w_hit_ct`). */
  readonly rocketHits: number;
  /** Flying aliens hit in this stage (`b_bug_flyng_hits_p_round`). */
  readonly flyingHits: number;
  /** Aliens left in the current group of 8 of a challenging stage (`w_bug_flying_hit_cnt`). */
  readonly groupLeft: number;
  readonly attacks: Attacks;
  readonly capture: Capture;
  /** Aliens left of a triple attack (`b8_99B0_X3attackcfg_ct`) and its bonus. */
  readonly tripleLeft: number;
  readonly tripleBonus: { readonly hundreds: number; readonly code: number };
  /** Game timer 1 to set: after a diving Boss is shot, no bombs for a while. */
  readonly quietTimer?: number;
  readonly sounds: readonly SoundName[];
  /** The fighters hit this frame: $60 (the second of a double fighter) and $62. */
  readonly fightersHit: readonly number[];
}

/** What the hit checks read. */
export interface HitInputs {
  readonly dual: boolean;
  /** A rescued fighter is spinning down: rockets ignore the captured fighters. */
  readonly rescueRunning: boolean;
  /** The attack waves are still entering: only special enemies and bombs hit the fighter. */
  readonly wavesEntering: boolean;
  readonly challengeBonus: ChallengeBonus;
}

/** The hit sound of each palette (`b_9AA0[1 + n]`). */
const HIT_SOUNDS: readonly SoundName[] = ['bossHit', 'butterflyHit', 'beeHit', 'bossDamaged'];

/** The world with object `id` changed. */
const change = (world: HitWorld, id: number, fields: Partial<GameObject>): HitWorld => ({
  ...world,
  objects: updateObject(world.objects, id, (o) => ({ ...o, ...fields })),
});

/** The world with `count` more hits of palette `color`. */
const count = (world: HitWorld, color: number, amount: number): HitWorld => ({
  ...world,
  hitCounts: world.hitCounts.map((n, i) => (i === color ? n + amount : n)),
});

/** `l_07DF`: the common end of a hit on an alien: capture state, sound and counters. */
const scoreHit = (world: HitWorld, id: number, color: number, flying: boolean): HitWorld => {
  // The capturing Boss is shot: a new capture may start.
  const freed =
    world.capture.object === id
      ? { ...world, capture: { ...world.capture, busy: false, object: 1 } }
      : world;
  const sound: SoundName = color === 7 ? 'fighterHit' : (HIT_SOUNDS[(color - 1) & 3] ?? 'beeHit');
  // A captured fighter is shot: it is lost for good, and a new capture may start.
  const released = color === 7 ? { ...freed, capture: { ...freed.capture, busy: false } } : freed;
  return count({ ...released, sounds: [...released.sounds, sound] }, color, flying ? 2 : 1);
};

/** `l_07DB`: the alien will explode, with no score sprite. */
const plainHit = (world: HitWorld, id: number, color: number, flying: boolean): HitWorld =>
  scoreHit(change(world, id, { hit: 0x81 }), id, color, flying);

/** A hit that shows a score sprite (`code`) and adds a bonus in hundreds of points. */
const bonusHit = (
  world: HitWorld,
  id: number,
  color: number,
  bonus: { readonly hundreds: number; readonly code: number },
): HitWorld =>
  scoreHit(count(change(world, id, { hit: bonus.code }), 15, bonus.hundreds), id, color, true);

/** `l_0849`: the special cases of a flying alien hit. */
const flyingSpecial = (world: HitWorld, id: number, color: number): HitWorld => {
  if (color === 7) return scoreHit(change(world, id, { hit: 0xb8 }), id, color, true);
  if (id === world.attacks.bonusBee || (id & 0x38) === 0x38) {
    const tripleLeft = (world.tripleLeft - 1) & 0xff;
    const counted = { ...world, tripleLeft };
    return tripleLeft === 0
      ? bonusHit(counted, id, color, world.tripleBonus)
      : plainHit(counted, id, color, true);
  }
  if (color !== 1) return plainHit(world, id, color, true);
  const score = world.attacks.bossScores[(id & 7) >> 1] ?? { hundreds: 1, code: 0xb5 };
  return bonusHit({ ...rescue(world, id & 7), quietTimer: 6 }, id, color, score);
};

/**
 * `l_0849`: a diving Boss carrying a captured fighter is shot. The fighter leaves its flight
 * slot, turns white and starts spinning down to join the player's (task `f_2000`).
 */
const rescue = (world: HitWorld, fighter: number): HitWorld => {
  const captured = objectAt(world.objects, fighter);
  if (captured.disposition !== DISPOSITION.flying) return world;
  return {
    ...change(world, fighter, { color: 9, disposition: 0 }),
    slots: world.slots.map((s, i) =>
      i === captured.counter && s?.object === fighter ? undefined : s,
    ),
    capture: withTasks(
      { ...world.capture, object: fighter, step: 0, pulling: true },
      { rescue: true },
    ),
    sounds: [...world.sounds, 'rescue'],
  };
};

/** `l_081E`: a flying alien is hit: its flight slot is freed and the group count goes down. */
const flyingHit = (world: HitWorld, id: number, color: number, inputs: HitInputs): HitWorld => {
  const target = objectAt(world.objects, id);
  // Only challenging stages count groups: elsewhere the counter stays at 0.
  const groupLeft = world.groupLeft === 0 ? 0 : world.groupLeft - 1;
  const counted: HitWorld = {
    ...world,
    slots: world.slots.map((s, i) => (i === target.counter && s?.object === id ? undefined : s)),
    flyingHits: world.flyingHits + 1,
    groupLeft,
  };
  if (world.groupLeft !== 1) return flyingSpecial(counted, id, color);
  const { tens, scoreCode } = inputs.challengeBonus;
  return scoreHit(count(change(counted, id, { hit: scoreCode }), 15, tens), id, color, true);
};

/**
 * `hitd_dspchr`: what a hit does, by the target's palette: a green Boss turns blue, a bomb
 * disappears, an alien starts to explode. Returns whether the check should stop (a bomb).
 */
const dispatch = (
  world: HitWorld,
  id: number,
  flying: boolean,
  inputs: HitInputs,
): { readonly world: HitWorld; readonly stop: boolean } => {
  const { color } = objectAt(world.objects, id);
  if (color === 0) {
    return {
      world: { ...change(world, id, { color: 1 }), sounds: [...world.sounds, 'bossDamaged'] },
      stop: false,
    };
  }
  if (color === 0x0b) {
    return {
      world: change(world, id, { x: 0, disposition: DISPOSITION.inactive }),
      stop: true,
    };
  }
  return {
    world: flying ? flyingHit(world, id, color, inputs) : plainHit(world, id, color, false),
    stop: false,
  };
};

/** Whether an object can be hit: in play, not exploding, not already hit. */
const hittable = (object: GameObject): boolean =>
  ((object.hit | object.disposition) & 0x80) === 0 && (object.disposition & 0xfe) !== 4;

/** The signed distance of two bytes. */
const delta = (a: number, b: number): number => ((a - b + 0x80) & 0xff) - 0x80;

/** `hitd_det_rckt`: a rocket within reach of an alien; the double fighter's rocket is wider. */
const rocketReaches = (rocket: GameObject, target: GameObject, dual: boolean): boolean => {
  const dy = delta(target.y >> 1, rocket.y >> 1);
  if (dy < -3 || dy > 2) return false;
  const dx = delta(target.x, rocket.x);
  return dual ? (dx >= -6 && dx <= 4) || (dx >= 9 && dx <= 19) : dx >= -5 && dx <= 5;
};

/** One rocket against the aliens. The rocket disappears on a hit, the check goes on. */
const rocketHits = (world: HitWorld, rocketId: number, inputs: HitInputs): HitWorld => {
  const rocket = objectAt(world.objects, rocketId);
  if (rocket.x === 0) return world;
  const first = inputs.rescueRunning ? 4 : 0;
  return Array.from({ length: ENEMY_OBJECTS - first }, (_, i) => (first + i) * 2).reduce(
    (current, id) => {
      const target = objectAt(current.objects, id);
      if (!hittable(target) || !rocketReaches(rocket, target, inputs.dual)) return current;
      const flying = ((target.disposition - 1) & 0xfe) !== 0;
      const hit = change({ ...current, rocketHits: current.rocketHits + 1 }, rocketId, {
        x: 0,
        wide: false,
      });
      return dispatch(hit, id, flying, inputs).world;
    },
    world,
  );
};

/** `hitd_det_fghtr`: an object touching the fighter. */
const touches = (fighter: GameObject, target: GameObject): boolean =>
  hittable(target) &&
  target.x !== 0 &&
  Math.abs(delta(target.x, fighter.x)) <= 6 &&
  Math.abs(delta(target.y >> 1, fighter.y >> 1)) <= 3;

/** The first of `ids` touching the fighter. */
const firstTouching = (objects: Objects, fighter: GameObject, ids: readonly number[]) =>
  ids.find((id) => touches(fighter, objectAt(objects, id)));

/**
 * `f_05EE`: one fighter against aliens (only special enemies while waves enter) and bombs.
 * An alien that touches the fighter is destroyed too.
 */
const fighterHits = (world: HitWorld, inputs: HitInputs, fighterId: number): HitWorld => {
  const fighter = objectAt(world.objects, fighterId);
  if (fighter.x === 0 || fighter.disposition === DISPOSITION.fighterExploding) return world;
  const aliens = inputs.wavesEntering
    ? [0x38, 0x3a, 0x3c, 0x3e]
    : Array.from({ length: ENEMY_OBJECTS }, (_, i) => i * 2);
  const bombs = Array.from({ length: BOMB_COUNT }, (_, i) => FIRST_BOMB + i * 2);
  const hit = { ...world, fightersHit: [...world.fightersHit, fighterId] };
  const alien = firstTouching(world.objects, fighter, aliens);
  if (alien !== undefined) return dispatch(hit, alien, true, inputs).world;
  const bomb = firstTouching(world.objects, fighter, bombs);
  return bomb === undefined ? world : dispatch(hit, bomb, true, inputs).world;
};

/** One frame of collisions: both rockets, then the fighter. */
export const detectHits = (
  world: HitWorld,
  inputs: HitInputs,
  fighterChecked: boolean,
): HitWorld => {
  const afterRockets = ROCKETS.reduce((current, id) => rocketHits(current, id, inputs), world);
  if (!fighterChecked) return afterRockets;
  const second = inputs.dual ? fighterHits(afterRockets, inputs, FIGHTER_2) : afterRockets;
  return fighterHits(second, inputs, FIGHTER);
};

/**
 * `f_1DB3`: every hit alien starts its explosion: the notification flag is cleared (what is
 * left is 1, or the score sprite to show), the palette becomes the explosion's.
 */
export const startExplosions = (objects: Objects): Objects =>
  objects.map((object, index) =>
    index < ENEMY_OBJECTS && (object.hit & 0x80) !== 0
      ? {
          ...object,
          hit: object.hit & 0x7f,
          disposition: DISPOSITION.exploding,
          counter: 0x40,
          color: 0x0a,
        }
      : object,
  );

/**
 * `hitd_fghtr_hit`: the fighter explodes, a big sprite centered where it was, for 15 steps of
 * the object manager.
 */
export const explodeFighter = (objects: Objects, id: number, x: number, y: number): Objects =>
  updateObject(objects, id, (o) => ({
    ...o,
    x: (x - 8) & 0xff,
    y: (y - 8) & 0x1ff,
    code: 0x20,
    color: 0x0b,
    disposition: DISPOSITION.fighterExploding,
    counter: 0x0f,
    big: true,
    flipX: false,
    flipY: false,
  }));
