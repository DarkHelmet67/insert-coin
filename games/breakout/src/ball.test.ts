import { describe, expect, it } from 'vitest';
import {
  bounceOffPaddle,
  bounceOffWalls,
  isLost,
  moveBall,
  paddleSegment,
  type Ball,
} from './ball';
import { initialPaddle } from './paddle';
import { PADDLE_Y, RIGHT_WALL_X } from './playfield';
import { speedFor } from './speed';

/** A ball in the middle of the screen, going down and right at the serve speed. */
const ball = (changes: Partial<Ball> = {}): Ball => ({
  x: 100,
  y: 120,
  dirX: 1,
  dirY: 1,
  hits: 0,
  fast: false,
  outer: false,
  canHitBrick: true,
  ...changes,
});

/** The paddle at x = 100, full width: segments start at 100, 104, 108 and 112. */
const paddle = { ...initialPaddle, x: 100 };

describe('ball', () => {
  it('moves by its speed in its direction', () => {
    const slow = speedFor(ball());
    expect(moveBall(ball())).toMatchObject({ x: 100 + slow.sideways, y: 120 + slow.vertical });
    const flat = speedFor(ball({ outer: true }));
    expect(moveBall(ball({ dirX: -1, dirY: -1, outer: true }))).toMatchObject({
      x: 100 - flat.sideways,
      y: 120 - flat.vertical,
    });
  });

  it('bounces off the side walls and the top wall', () => {
    expect(bounceOffWalls(ball({ x: 3, dirX: -1 }))).toMatchObject({ x: 4, dirX: 1 });
    expect(bounceOffWalls(ball({ x: RIGHT_WALL_X - 2 }))).toMatchObject({ dirX: -1 });
    expect(bounceOffWalls(ball({ y: 7, dirY: -1, canHitBrick: false }))).toMatchObject({
      dirY: 1,
      canHitBrick: true,
    });
  });

  it('splits the paddle into four segments', () => {
    expect(paddleSegment(ball({ x: 98 }), paddle)).toBe(0);
    expect(paddleSegment(ball({ x: 103 }), paddle)).toBe(1);
    expect(paddleSegment(ball({ x: 106 }), paddle)).toBe(2);
    expect(paddleSegment(ball({ x: 114 }), paddle)).toBe(3);
  });

  it('sends the ball back up to the side of the half it hits, flatter off the ends', () => {
    const left = bounceOffPaddle(ball({ x: 98, y: PADDLE_Y - 1 }), paddle);
    expect(left).toMatchObject({ dirX: -1, dirY: -1, outer: true, hits: 1 });
    const right = bounceOffPaddle(ball({ x: 106, y: PADDLE_Y - 1, dirX: -1 }), paddle);
    expect(right).toMatchObject({ dirX: 1, dirY: -1, outer: false });
  });

  it('ignores the paddle when the ball misses it or is going up', () => {
    const missed = ball({ x: 40, y: PADDLE_Y - 1 });
    expect(bounceOffPaddle(missed, paddle)).toBe(missed);
    const goingUp = ball({ x: 106, y: PADDLE_Y - 1, dirY: -1 });
    expect(bounceOffPaddle(goingUp, paddle)).toBe(goingUp);
  });

  it('is lost below the bottom of the screen', () => {
    expect(isLost(ball({ y: 207 }))).toBe(false);
    expect(isLost(ball({ y: 208 }))).toBe(true);
  });
});
