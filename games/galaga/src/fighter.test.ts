import { describe, expect, it } from 'vitest';
import { FIGHTER_START, moveFighter, placeFighter } from './fighter';
import { emptyObjects, FIGHTER, FIGHTER_2, objectAt, type Objects } from './objects';

/** Moves the fighter `frames` times in `direction`, returning the x of both fighters. */
const hold = (
  direction: -1 | 1,
  frames: number,
  dual = false,
  start: Objects = placeFighter(emptyObjects()),
): { readonly x: number; readonly x2: number } => {
  let objects = start;
  let toggle = false;
  for (let i = 0; i < frames; i += 1) {
    const move = moveFighter(objects, toggle, direction, dual);
    objects = move.objects;
    toggle = move.stepToggle;
  }
  return { x: objectAt(objects, FIGHTER).x, x2: objectAt(objects, FIGHTER_2).x };
};

describe('moveFighter', () => {
  it('steps 1 then 2 pixels in turn: 3 pixels every 2 frames', () => {
    expect(hold(1, 1).x).toBe(FIGHTER_START.x + 1);
    expect(hold(1, 2).x).toBe(FIGHTER_START.x + 3);
    expect(hold(-1, 4).x).toBe(FIGHTER_START.x - 6);
  });

  it('stops at the screen sides', () => {
    expect(hold(-1, 200).x).toBeLessThan(0x12);
    expect(hold(-1, 200).x).toBeGreaterThanOrEqual(0x10);
    expect(hold(1, 200).x).toBeGreaterThanOrEqual(0xe1);
    expect(hold(1, 200).x).toBeLessThanOrEqual(0xe2);
  });

  it('keeps the second fighter of a double fighter 15 pixels to the right', () => {
    const { x, x2 } = hold(1, 200, true);
    expect(x).toBeGreaterThanOrEqual(0xd1);
    expect(x2).toBe(x + 15);
  });

  it('resets the step when the stick is released', () => {
    expect(moveFighter(placeFighter(emptyObjects()), true, 0, false).stepToggle).toBe(false);
  });
});
