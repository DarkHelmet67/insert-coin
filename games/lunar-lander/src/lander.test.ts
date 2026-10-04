import { describe, expect, it } from 'vitest';
import {
  isFrictionFrame,
  landerOrientation,
  landerPosition,
  moveLander,
  POSITION_SCALE,
  slowDown,
  startingLander,
  stepOf,
} from './lander';
import { MISSIONS } from './missions';

describe('the module', () => {
  it('starts high on the left, flying right and lying on its side', () => {
    const lander = startingLander();
    expect(landerPosition(lander)).toEqual({ x: 256, y: 2696 });
    expect(lander.vx).toBe(0x3200);
    expect(landerOrientation(lander)).toBe(16);
  });

  it('moves with the top bits of its speed only', () => {
    expect(stepOf(0x3255, 'major')).toBe(0x3200);
    expect(stepOf(0x3255, 'minor')).toBe(0x3240);
    expect(stepOf(-0xff, 'major')).toBe(0);
  });

  it('moves first, then changes speed with gravity and push', () => {
    const lander = { ...startingLander(), vy: 0x1000 };
    const moved = moveLander(lander, { x: 3, y: 5 }, MISSIONS.cadet, 'minor');
    expect(moved.y - lander.y).toBe(0x1000);
    expect(moved.vy).toBe(0x1000 - 0x11 + 5);
    expect(moved.vx).toBe(0x3200 + 3);
  });

  it('falls ever faster with no push', () => {
    const still = { ...startingLander(), vx: 0, vy: 0 };
    const later = Array.from({ length: 100 }).reduce(
      (lander: typeof still) => moveLander(lander, { x: 0, y: 0 }, MISSIONS.cadet, 'minor'),
      still,
    );
    expect(later.vy).toBe(-100 * 0x11);
    expect(later.y).toBeLessThan(still.y - POSITION_SCALE);
  });

  it('slows down once every 16 frames in TRAINING', () => {
    expect(isFrictionFrame(8)).toBe(true);
    expect(isFrictionFrame(24)).toBe(true);
    expect(isFrictionFrame(9)).toBe(false);
    expect(slowDown(startingLander()).vx).toBe(0x3200 - 0x190);
  });
});
