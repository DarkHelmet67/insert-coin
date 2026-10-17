import { describe, expect, it } from 'vitest';
import { WALL_POINTS } from './bricks';
import { debug, DEBUG_OFF } from './debug';
import { newRound, saveInGodMode } from './play';
import { SCREEN_HEIGHT } from './playfield';
import { servedBall } from './serve';
import { tuning } from './tuning.config';

describe('debug mode', () => {
  it('is off in the published game', () => {
    expect(tuning.debug.enabled).toBe(false);
    expect(debug).toEqual(DEBUG_OFF);
  });

  it('can start on the second wall, with the first wall already scored', () => {
    expect(newRound(1)).toMatchObject({ score: 0, refilled: false });
    expect(newRound(2)).toMatchObject({ score: WALL_POINTS, refilled: true });
  });

  it('can serve the ball with some paddle hits already counted', () => {
    expect(servedBall(10).hits).toBe(0);
    expect(servedBall(10, 12).hits).toBe(12);
  });

  it('in god mode the ball bounces off the bottom instead of being lost', () => {
    const lost = { ...servedBall(10), y: SCREEN_HEIGHT, dirY: 1 as const };
    expect(saveInGodMode(lost, false)).toBe(lost);
    const saved = saveInGodMode(lost, true);
    expect(saved.dirY).toBe(-1);
    expect(saved.y).toBeLessThan(SCREEN_HEIGHT);
  });
});
