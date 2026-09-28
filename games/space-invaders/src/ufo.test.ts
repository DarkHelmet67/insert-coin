import { describe, expect, it } from 'vitest';
import {
  initialUfoState,
  launchSaucer,
  stepUfo,
  UFO_INTERVAL,
  UFO_LEFT_X,
  UFO_RIGHT_X,
  ufoScore,
  type UfoState,
} from './ufo';

/** The state when the countdown is about to expire. */
const due: UfoState = { ...initialUfoState, countdown: 0 };

describe('ufoScore', () => {
  it('gives 300 points on the 23rd shot and every 15 shots after', () => {
    expect([23, 38, 53].map(ufoScore)).toEqual([300, 300, 300]);
  });

  it('gives 50 to 150 points on the other shots', () => {
    expect([1, 2, 4, 7].map(ufoScore)).toEqual([50, 50, 150, 50]);
  });
});

describe('stepUfo', () => {
  it('counts down between visits', () => {
    expect(stepUfo(initialUfoState, 55, 0).countdown).toBe(UFO_INTERVAL - 1);
  });

  it('launches the ship when the countdown expires', () => {
    expect(stepUfo(due, 55, 0)).toEqual({ countdown: UFO_INTERVAL, saucer: launchSaucer(0) });
  });

  it('skips the visit when fewer than 8 invaders are left', () => {
    expect(stepUfo(due, 7, 0).saucer).toBeUndefined();
  });

  it('enters from the side chosen by the parity of the shots fired', () => {
    expect(launchSaucer(0)).toMatchObject({ x: UFO_LEFT_X, direction: 1 });
    expect(launchSaucer(1)).toMatchObject({ x: UFO_RIGHT_X, direction: -1 });
  });

  it('flies one pixel per frame and leaves at the other side', () => {
    const flying = stepUfo(due, 55, 0);
    expect(stepUfo(flying, 55, 0).saucer?.x).toBe(UFO_LEFT_X + 1);
    const leaving = { ...flying, saucer: { x: UFO_RIGHT_X, direction: 1 as const, age: 0 } };
    expect(stepUfo(leaving, 55, 0).saucer).toBeUndefined();
  });
});
