import type { Point } from './position';
import { nextRandom, nextRandomAfter, type Rng } from './random';
import { EXPLOSION_START, rockCount, type RockSlot } from './rocks';
import type { SaucerSlot } from './saucer';
import { SHIP_START, type Ship } from './ship';

/**
 * The life of the player's ship between one explosion and the next: flying, hidden (waiting to
 * come back or travelling through hyperspace) or exploding. The program keeps the same thing in
 * the ship's status byte and in a timer [P $021B, $02FA].
 */

/** Why the ship is off the screen, and so how it comes back. */
export type HiddenReason =
  /** After an explosion or at the start: it waits for a clear space in the middle. */
  | 'respawn'
  /** A hyperspace jump that ends well: it appears wherever it landed. */
  | 'jump'
  /** A hyperspace jump that ends badly: it explodes where it lands. */
  | 'fatal-jump';

/** Where the ship is in its life. */
export type ShipLife =
  | { readonly kind: 'flying' }
  | { readonly kind: 'hidden'; readonly timer: number; readonly reason: HiddenReason }
  | {
      readonly kind: 'exploding';
      /** Climbs from $A0 by one every second frame; past $FF the explosion is over. */
      readonly status: number;
      /** Frames since the explosion started, for the pieces flying away. */
      readonly age: number;
    };

/** The part of the game state about the player. */
export interface PlayerState {
  readonly ship: Ship;
  readonly life: ShipLife;
  /** Ships left, counting the one in play, as the icons under the score show [P $57]. */
  readonly lives: number;
}

/** Frames spent in hyperspace [P $6E92]: 48, about 0.8 seconds. */
export const HYPERSPACE_TIME = 0x30;

/**
 * Frames between the end of the explosion and the first check for a clear space [P $6992]:
 * one frame, then a timer of 16.
 */
export const RESPAWN_DELAY = 0x11;

/** A hidden ship waiting to appear: `timer` frames, then the check for a clear space. */
export const waitingToRespawn = (timer: number): ShipLife => ({
  kind: 'hidden',
  timer,
  reason: 'respawn',
});

/** The ship is hit: it stops, starts exploding and costs a life [P $6B1E-$6B33]. */
export const killShip = (player: PlayerState): PlayerState => ({
  ship: { ...player.ship, vx: 0, vy: 0, thrusting: false },
  life: { kind: 'exploding', status: EXPLOSION_START, age: 0 },
  lives: player.lives - 1,
});

/** `value` kept between `low` and `high`. */
const clamp = (value: number, low: number, high: number): number =>
  Math.max(low, Math.min(high, value));

/** A coordinate with a new high byte: the program changes only the high byte of each axis. */
const withHighByte = (value: number, high: number): number => (high << 8) | (value & 0xff);

/** Where a hyperspace jump lands, and whether the ship survives it. */
export interface Landing {
  readonly position: Point;
  readonly fatal: boolean;
  readonly rng: Rng;
}

/**
 * Picks the landing point of a hyperspace jump [P $6E97-$6ED5]. The column is random; the row
 * comes from a second number, drawn five times. One time in four (values 24-31) that number
 * also decides the risk: the jump fails when a value from 4 to 18 is not smaller than the
 * number of rocks on screen. So hyperspace is most dangerous when **few** rocks are left.
 */
export const hyperspaceLanding = (from: Point, rocks: readonly RockSlot[], rng: Rng): Landing => {
  const column = nextRandom(rng);
  const row = nextRandomAfter(column.rng, 5);
  const value = row.value & 0x1f;
  const risky = value >= 24;
  const rowHigh = risky ? (value & 7) * 2 + 4 : value;
  return {
    position: {
      x: withHighByte(from.x, clamp(column.value & 0x1f, 3, 0x1c)),
      y: withHighByte(from.y, clamp(rowHigh, 3, 0x14)),
    },
    fatal: risky && rowHigh >= rockCount(rocks),
    rng: row.rng,
  };
};

/** The ship leaves the screen for hyperspace: it stops and moves to where it will land. */
export const jumpIntoHyperspace = (
  player: PlayerState,
  rocks: readonly RockSlot[],
  rng: Rng,
): { readonly player: PlayerState; readonly rng: Rng } => {
  const landing = hyperspaceLanding(player.ship.position, rocks, rng);
  return {
    player: {
      ...player,
      ship: { ...player.ship, position: landing.position, vx: 0, vy: 0, thrusting: false },
      life: {
        kind: 'hidden',
        timer: HYPERSPACE_TIME,
        reason: landing.fatal ? 'fatal-jump' : 'jump',
      },
    },
    rng: landing.rng,
  };
};

/**
 * Whether two coordinates are close on one axis [P $7140]: their high bytes (blocks of 256
 * position units) differ by -4 to +3. Like the collisions, it ignores the wrap-around.
 */
const closeOnAxis = (a: number, b: number): boolean => {
  const difference = (a >> 8) - (b >> 8);
  return difference >= -4 && difference <= 3;
};

/**
 * Whether the middle of the screen is clear for a new ship [P $7139]: no rock (even exploding)
 * or saucer in a square of about 256 × 256 screen units around the starting point.
 */
export const spawnIsClear = (
  objects: readonly (RockSlot | SaucerSlot)[],
  at: Point = SHIP_START,
): boolean =>
  !objects.some(
    (slot) =>
      slot !== null && closeOnAxis(slot.position.x, at.x) && closeOnAxis(slot.position.y, at.y),
  );

/**
 * One frame of a hidden ship [P $703F-$7085]: the timer runs down, then the ship comes back.
 * After a jump it appears where it landed, with no check; after a fatal jump it explodes there;
 * after an explosion it waits, a frame at a time, until the middle of the screen is clear, and
 * never comes back while a saucer is on screen: it checks again two frames later [P $705D].
 */
export const updateHidden = <T extends PlayerState>(
  player: T,
  rocks: readonly RockSlot[],
  saucer: SaucerSlot = null,
): T => {
  const { life } = player;
  if (life.kind !== 'hidden') return player;
  if (life.timer > 1) return { ...player, life: { ...life, timer: life.timer - 1 } };
  if (life.reason === 'fatal-jump') return { ...player, ...killShip(player) };
  if (life.reason === 'respawn') {
    if (!spawnIsClear([...rocks, saucer], player.ship.position)) {
      return { ...player, life: { ...life, timer: 1 } };
    }
    if (saucer !== null) return { ...player, life: { ...life, timer: 2 } };
  }
  return { ...player, life: { kind: 'flying' } };
};

/**
 * One frame of the explosion [P $6F6B]: the status climbs by one every second frame, 192 frames
 * in all. At the end the ship goes back to the start, still, but keeps its direction: the
 * program never resets it [P $71E8].
 */
export const updateExplosion = <T extends PlayerState>(player: T, frame: number): T => {
  const { life } = player;
  if (life.kind !== 'exploding') return player;
  const status = life.status + (frame & 1);
  if (status > 0xff) {
    return {
      ...player,
      ship: { ...player.ship, position: SHIP_START, vx: 0, vy: 0 },
      life: waitingToRespawn(RESPAWN_DELAY),
    };
  }
  return { ...player, life: { kind: 'exploding', status, age: life.age + 1 } };
};
