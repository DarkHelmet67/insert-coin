import { describe, expect, it } from 'vitest';
import { CANNON_Y } from './cannon';
import { fireShot, moveShot, SHOT_SPEED, SHOT_TOP_LIMIT } from './shot';

describe('fireShot', () => {
  it('starts at the tip of the cannon', () => {
    expect(fireShot({ x: 100 })).toEqual({ x: 106, y: CANNON_Y - 4 });
  });
});

describe('moveShot', () => {
  it('moves up at the shot speed', () => {
    expect(moveShot({ x: 50, y: 200 }, 0.1)).toEqual({ x: 50, y: 200 - SHOT_SPEED * 0.1 });
  });

  it('disappears above the playfield', () => {
    expect(moveShot({ x: 50, y: SHOT_TOP_LIMIT + 1 }, 0.1)).toBeUndefined();
  });

  it('moves less than an invader height per step, so it cannot skip one', () => {
    expect(SHOT_SPEED / 60).toBeLessThan(8);
  });
});
