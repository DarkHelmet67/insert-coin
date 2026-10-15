import {
  DISPOSITION,
  FIGHTER,
  objectAt,
  ROCKETS,
  updateObject,
  type GameObject,
  type Objects,
} from './objects';

/** Sprite palette of rockets. */
export const ROCKET_COLOR = 9;

/**
 * How a rocket travels (`b_92A0[4]`, the "rocket attribute"): its step along x and y every frame.
 * A rocket fired by a fighter that is turning flies along the fighter's direction.
 */
export interface RocketPath {
  readonly dx: number;
  readonly dy: number;
}

/** Pixels a rocket travels per frame along its main axis. */
const ROCKET_SPEED = 6;

/**
 * `c_1F0F` and `rckt_man`: the sprite code and the path of a rocket fired by `fighter`. The main
 * axis gets 6 pixels a frame, the other 0, 2, 4 or 6 according to how far the drawing (0
 * horizontal ... 6 upright) is turned: 45 degrees gives 6 and 6. Only a fighter spinning in a
 * capture or a rescue fires sideways.
 */
export const rocketFor = (fighter: GameObject): { readonly code: number } & RocketPath => {
  const tile = fighter.code & 7;
  const code = tile >= 5 ? 0x30 : tile >= 2 ? 0x31 : 0x33;
  const vertical = tile >= 4;
  const side = 2 * (vertical ? 6 - tile : tile);
  // An unmirrored drawing points left (and up): mirroring sends the rocket right (and down).
  const sx = fighter.flipX ? 1 : -1;
  const sy = fighter.flipY ? 1 : -1;
  // `side` can be 0: "+ 0" turns a -0 into a plain 0.
  return vertical
    ? { code, dx: sx * side + 0, dy: sy * ROCKET_SPEED }
    : { code, dx: sx * ROCKET_SPEED, dy: sy * side + 0 };
};

/** Result of pressing fire. */
export interface Firing {
  readonly objects: Objects;
  readonly paths: readonly RocketPath[];
  /** Whether a rocket left: the shot sound plays and the shot counter grows. */
  readonly fired: boolean;
}

/** `c_1F0F`: fires a rocket from the fighter, if one of the two is free. */
export const fireRocket = (
  objects: Objects,
  paths: readonly RocketPath[],
  dual: boolean,
): Firing => {
  const fighter = objectAt(objects, FIGHTER);
  const free = ROCKETS.findIndex((id) => objectAt(objects, id).x === 0);
  const id = ROCKETS[free];
  if (id === undefined || fighter.x === 0) return { objects, paths, fired: false };
  const rocket = rocketFor(fighter);
  return {
    objects: updateObject(objects, id, (o) => ({
      ...o,
      disposition: DISPOSITION.shot,
      code: rocket.code,
      color: ROCKET_COLOR,
      x: fighter.x,
      y: fighter.y,
      flipX: fighter.flipX,
      flipY: fighter.flipY,
      wide: dual,
    })),
    paths: paths.map((path, index) => (index === free ? { dx: rocket.dx, dy: rocket.dy } : path)),
    fired: true,
  };
};

/** A rocket leaves the play area above y = 40 or below 312, or past x = 240 (`rckt_man`). */
const outOfPlay = (x: number, y: number): boolean =>
  x >= 0xf0 || y >> 1 < 0x28 >> 1 || y >> 1 >= 0x138 >> 1;

/** A free rocket: off screen, ready to be fired again. */
const parked = (rocket: GameObject): GameObject => ({
  ...rocket,
  disposition: DISPOSITION.inactive,
  x: 0,
  wide: false,
});

/** `rckt_man`: moves both rockets one frame and frees the ones leaving the screen. */
export const moveRockets = (objects: Objects, paths: readonly RocketPath[]): Objects =>
  ROCKETS.reduce((current, id, index) => {
    const rocket = objectAt(current, id);
    const path = paths[index];
    if (rocket.x === 0 || path === undefined) return current;
    const x = (rocket.x + path.dx) & 0xff;
    const y = (rocket.y + path.dy) & 0x1ff;
    return updateObject(current, id, (o) => (outOfPlay(x, y) ? parked(o) : { ...o, x, y }));
  }, objects);

/** No rocket in flight. */
export const NO_PATHS: readonly RocketPath[] = [
  { dx: 0, dy: -ROCKET_SPEED },
  { dx: 0, dy: -ROCKET_SPEED },
];
