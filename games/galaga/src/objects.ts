/*
 * The object table of the original program. Galaga keeps every moving thing in one table of
 * 64 objects, numbered by their offset in memory ($00, $02 ... $7E): the program's own names and
 * comments refer to them by that number, and so does the remake, to stay close to the source.
 *
 *   $00-$06  fighters captured by the four Bosses     $38-$3E  "transients" (special enemies)
 *   $08-$2E  20 bees (Zako)                           $40-$5E  16 butterflies (Goei)
 *   $30-$36  4 Boss Galaga                            $60-$62  the player's fighters
 *   $64-$66  the 2 rockets                            $68-$76  the 8 bombs
 *
 * Each object has a "disposition" (what it is doing, table b_8800) and the registers of its
 * sprite: code, palette, position, mirroring and size.
 */

/** What an object is doing: the values the original program keeps in table `b_8800`. */
export const DISPOSITION = {
  /** Resting in the formation. */
  home: 0x01,
  /** Just arrived home: turning upright before resting. */
  rotating: 0x02,
  /** Flying, under control of a flight program that does not return home yet. */
  launched: 0x03,
  /** Hit: playing its explosion. */
  exploding: 0x04,
  /** Showing the score of a hit (Boss, captured fighter, special enemies). */
  showingScore: 0x05,
  /** A rocket or a bomb in flight. */
  shot: 0x06,
  /** Entering the screen in an attack wave. */
  entering: 0x07,
  /** The player's fighter, exploding. */
  fighterExploding: 0x08,
  /** Flying: diving, or heading back to the formation. */
  flying: 0x09,
  /** Not in play. */
  inactive: 0x80,
} as const;

/** The registers of one object. */
export interface GameObject {
  readonly disposition: number;
  /**
   * The second byte of the object's entry in `b_8800`: the flight slot of a flying alien, or the
   * step of an explosion.
   */
  readonly counter: number;
  /** Sprite code (0-127) and sprite palette (0-15). */
  readonly code: number;
  readonly color: number;
  /** Sprite position: x is 8 bits, y 9 bits; 0 hides the sprite. */
  readonly x: number;
  readonly y: number;
  readonly flipX: boolean;
  readonly flipY: boolean;
  /** Double size: four tiles in a 32 × 32 square (the big explosions). */
  readonly big: boolean;
  /** Double width: two tiles side by side (the rocket of a double fighter). */
  readonly wide: boolean;
  /**
   * Hit notification (`b_9200_obj_collsn_notif`): 0 when nothing happened, $81 when hit and
   * waiting to explode, or the code of the score sprite to show after the explosion.
   */
  readonly hit: number;
}

/** An unused object, off screen. */
export const NO_OBJECT: GameObject = {
  disposition: DISPOSITION.inactive,
  counter: 0,
  code: 0,
  color: 0,
  x: 0,
  y: 0,
  flipX: false,
  flipY: false,
  big: false,
  wide: false,
  hit: 0,
};

/** Number of objects in the table. */
export const OBJECT_COUNT = 64;

/** Object numbers used by name. */
export const FIGHTER = 0x62;
export const FIGHTER_2 = 0x60;
export const ROCKETS = [0x64, 0x66] as const;
export const FIRST_BOMB = 0x68;
export const BOMB_COUNT = 8;
/** The aliens and captured fighters: objects $00-$5E, the ones rockets can hit. */
export const ENEMY_OBJECTS = 0x30;

/** The whole table. */
export type Objects = readonly GameObject[];

/** A table of unused objects. */
export const emptyObjects = (): Objects => Array.from({ length: OBJECT_COUNT }, () => NO_OBJECT);

/** Object number `id` ($00-$7E). */
export const objectAt = (objects: Objects, id: number): GameObject => objects[id >> 1] ?? NO_OBJECT;

/** The table with object `id` changed by `change`. */
export const updateObject = (
  objects: Objects,
  id: number,
  change: (object: GameObject) => GameObject,
): Objects => objects.map((object, index) => (index === id >> 1 ? change(object) : object));

/** The table with several objects changed: `changes` maps object numbers to their new values. */
export const replaceObjects = (
  objects: Objects,
  changes: ReadonlyMap<number, GameObject>,
): Objects => objects.map((object, index) => changes.get(index << 1) ?? object);

/** The numbers of the objects `first`, `first + 2` ... (`count` of them). */
export const objectIds = (first: number, count: number): readonly number[] =>
  Array.from({ length: count }, (_, index) => first + index * 2);

/** Whether the object is in play (its disposition is not "inactive"). */
export const isActive = (object: GameObject): boolean =>
  (object.disposition & DISPOSITION.inactive) === 0;
