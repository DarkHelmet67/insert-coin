/*
 * `f_1EA4`: the bombs fall 2 and 3 pixels on alternate frames and drift sideways at the rate
 * computed when they were dropped: a fixed-point rate of 32 steps per pixel, with the remainder
 * carried from frame to frame.
 */
import type { BombDrift } from './flight-world';
import { BOMB_COUNT, FIRST_BOMB, objectAt, updateObject, type Objects } from './objects';

/** Sprite code and palette of a bomb (`c_game_or_demo_init`). */
export const BOMB_CODE = 0x30;
export const BOMB_COLOR = 0x0b;

/** The bomb objects with their sprite set up, off screen. */
export const setUpBombs = (objects: Objects): Objects =>
  Array.from({ length: BOMB_COUNT }, (_, i) => FIRST_BOMB + i * 2).reduce(
    (current, id) =>
      updateObject(current, id, (o) => ({
        ...o,
        code: BOMB_CODE,
        color: BOMB_COLOR,
        flipX: false,
        flipY: true,
        x: 0,
      })),
    objects,
  );

/** The result of a frame of bombs. */
export interface BombsMoved {
  readonly objects: Objects;
  readonly drift: readonly BombDrift[];
}

/** One frame of the 8 bombs. */
export const moveBombs = (
  objects: Objects,
  drift: readonly BombDrift[],
  frame: number,
): BombsMoved => {
  const dy = (frame & 1) + 2;
  return drift.reduce<BombsMoved>(
    (moved, bomb, i) => {
      const id = FIRST_BOMB + i * 2;
      const object = objectAt(moved.objects, id);
      if (object.code !== BOMB_CODE || object.x === 0) return moved;
      const sum = (bomb.rate & 0x7e) + bomb.accumulator;
      const pixels = (sum >> 5) & 7;
      const dx = (bomb.rate & 0x80) !== 0 ? -pixels : pixels;
      return {
        objects: updateObject(moved.objects, id, (o) => ({
          ...o,
          x: (o.x + dx) & 0xff,
          y: (o.y + dy) & 0x1ff,
        })),
        drift: moved.drift.map((d, k) => (k === i ? { ...d, accumulator: sum & 0x1f } : d)),
      };
    },
    { objects, drift },
  );
};
