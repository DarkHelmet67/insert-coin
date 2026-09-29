import { describe, expect, it } from 'vitest';
import type { Ball } from './ball';
import { hitBrick } from './brick-hit';
import { fullWall, hasBrick } from './bricks';

/** A ball going up into the bottom (yellow) row, under column 3. */
const ball = (changes: Partial<Ball> = {}): Ball => ({
  x: 50,
  y: 70,
  dirX: 1,
  dirY: -1,
  hits: 2,
  fast: false,
  outer: false,
  canHitBrick: true,
  ...changes,
});

describe('hitBrick', () => {
  it('breaks the brick, scores its points and sends the ball back', () => {
    const { ball: after, wall, points } = hitBrick(ball(), fullWall());
    expect(hasBrick(wall, { row: 7, column: 3 })).toBe(false);
    expect(points).toBe(1);
    expect(after).toMatchObject({ dirY: 1, dirX: 1, canHitBrick: false, hits: 2 });
  });

  it('goes through the other bricks until the paddle or the top wall', () => {
    const wall = fullWall();
    const result = hitBrick(ball({ canHitBrick: false }), wall);
    expect(result).toEqual({ ball: ball({ canHitBrick: false }), wall, points: 0 });
  });

  it('counts a hit when a brick sends the ball back up', () => {
    const fromAbove = hitBrick(ball({ y: 39, dirY: 1 }), fullWall());
    expect(fromAbove.points).toBe(7);
    expect(fromAbove.ball).toMatchObject({ dirY: -1, hits: 3 });
  });

  it('goes to top speed after an orange or red brick, not after a yellow one', () => {
    expect(hitBrick(ball(), fullWall()).ball.fast).toBe(false);
    expect(hitBrick(ball({ y: 39, dirY: 1 }), fullWall()).ball.fast).toBe(true);
  });

  it('does nothing away from the bricks', () => {
    expect(hitBrick(ball({ y: 120 }), fullWall()).points).toBe(0);
  });
});
