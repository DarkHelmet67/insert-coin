import { describe, expect, it } from 'vitest';
import { placeFighter } from './fighter';
import { emptyObjects, FIGHTER, NO_OBJECT, objectAt, ROCKETS, updateObject } from './objects';
import { fireRocket, moveRockets, NO_PATHS, rocketFor } from './rockets';

describe('rocketFor', () => {
  it('fires straight up from an upright fighter', () => {
    expect(rocketFor({ ...NO_OBJECT, code: 6 })).toEqual({ code: 0x30, dx: 0, dy: -6 });
  });

  it('fires along the diagonal from a fighter turned 45 degrees', () => {
    expect(rocketFor({ ...NO_OBJECT, code: 3, flipX: true })).toEqual({
      code: 0x31,
      dx: 6,
      dy: -6,
    });
  });

  it('fires sideways from a horizontal fighter', () => {
    expect(rocketFor({ ...NO_OBJECT, code: 0 })).toEqual({ code: 0x33, dx: -6, dy: 0 });
  });
});

describe('fireRocket', () => {
  it('fires at most two rockets', () => {
    const start = placeFighter(emptyObjects());
    const first = fireRocket(start, NO_PATHS, false);
    const second = fireRocket(first.objects, first.paths, false);
    const third = fireRocket(second.objects, second.paths, false);
    expect([first.fired, second.fired, third.fired]).toEqual([true, true, false]);
    expect(objectAt(second.objects, ROCKETS[1]).x).toBe(objectAt(start, FIGHTER).x);
  });

  it('fires a double width rocket from a double fighter', () => {
    const fired = fireRocket(placeFighter(emptyObjects()), NO_PATHS, true);
    expect(objectAt(fired.objects, ROCKETS[0]).wide).toBe(true);
  });
});

describe('moveRockets', () => {
  it('moves a rocket 6 pixels up a frame and frees it at the top', () => {
    const fired = fireRocket(placeFighter(emptyObjects()), NO_PATHS, false);
    const moved = moveRockets(fired.objects, fired.paths);
    expect(objectAt(moved, ROCKETS[0]).y).toBe(objectAt(fired.objects, ROCKETS[0]).y - 6);
    const nearTop = updateObject(fired.objects, ROCKETS[0], (o) => ({ ...o, y: 44 }));
    expect(objectAt(moveRockets(nearTop, fired.paths), ROCKETS[0]).x).toBe(0);
  });
});
