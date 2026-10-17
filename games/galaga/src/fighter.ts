import { FIGHTER, FIGHTER_2, objectAt, updateObject, type Objects } from './objects';

/** Where the fighter appears (`c_player_respawn`): centered at the bottom of the screen. */
export const FIGHTER_START = { x: 0x7a, y: 0x129 } as const;

/** Leftmost position, and rightmost for a single and a double fighter (`c_1F92`). */
const LEFT_LIMIT = 0x12;
const RIGHT_LIMIT = 0xe1;
const RIGHT_LIMIT_DUAL = 0xd1;

/** The second fighter of a double fighter flies 15 pixels to the right of the first. */
export const DUAL_SPACING = 0x0f;

/** Sprite palette of the player's fighter (white, red and blue). */
export const FIGHTER_COLOR = 9;
/** Sprite code of the upright fighter. */
export const FIGHTER_UPRIGHT = 6;

/** The objects with the fighter placed at its start position, upright. */
export const placeFighter = (objects: Objects): Objects =>
  updateObject(objects, FIGHTER, (o) => ({
    ...o,
    code: FIGHTER_UPRIGHT,
    color: FIGHTER_COLOR,
    x: FIGHTER_START.x,
    y: FIGHTER_START.y,
    flipX: false,
    flipY: false,
    big: false,
    wide: false,
  }));

/** Debug mode: the objects with a double fighter at the start position, the second on the right. */
export const placeDualFighter = (objects: Objects): Objects => {
  const placed = placeFighter(objects);
  const main = objectAt(placed, FIGHTER);
  return updateObject(placed, FIGHTER_2, () => ({ ...main, x: main.x + DUAL_SPACING }));
};

/** Result of one frame of fighter movement. */
export interface FighterMove {
  readonly objects: Objects;
  /** Alternates 1 and 2 pixels steps while a direction is held (`b_92A0[3]`). */
  readonly stepToggle: boolean;
}

/**
 * `c_1F92`: moves the fighter. A held direction gives steps of 1 and 2 pixels in turn,
 * 1.5 pixels a frame on average; holding both directions moves right, as on the cabinet,
 * whose joystick reads "right" first.
 */
export const moveFighter = (
  objects: Objects,
  stepToggle: boolean,
  direction: -1 | 0 | 1,
  dual: boolean,
): FighterMove => {
  if (direction === 0) return { objects, stepToggle: false };
  const toggle = !stepToggle;
  const step = toggle ? 1 : 2;
  const x = objectAt(objects, FIGHTER).x;
  if (x === 0) return { objects, stepToggle: toggle };
  const blocked =
    direction > 0 ? (dual && x >= RIGHT_LIMIT_DUAL) || x >= RIGHT_LIMIT : x < LEFT_LIMIT;
  if (blocked) return { objects, stepToggle: toggle };
  const newX = (x + direction * step) & 0xff;
  const moved = updateObject(objects, FIGHTER, (o) => ({ ...o, x: newX }));
  return {
    objects: dual
      ? updateObject(moved, FIGHTER_2, (o) => ({ ...o, x: (newX + DUAL_SPACING) & 0xff }))
      : moved,
    stepToggle: toggle,
  };
};
