import { describe, expect, it } from 'vitest';
import {
  BRICK_COLUMNS,
  BRICK_PITCH,
  BRICK_ROWS,
  BRICK_HEIGHT,
  BRICKS_TOP,
  PADDLE_Y,
  RIGHT_WALL_X,
  SCREEN_HEIGHT,
} from './playfield';

describe('playfield', () => {
  it('fits the 14 brick columns between the walls, the first one partly under the left wall', () => {
    expect(BRICK_COLUMNS * BRICK_PITCH).toBe(RIGHT_WALL_X);
  });

  it('keeps the bricks above the paddle and the paddle on screen', () => {
    expect(BRICKS_TOP + BRICK_ROWS * BRICK_HEIGHT).toBeLessThan(PADDLE_Y);
    expect(PADDLE_Y).toBeLessThan(SCREEN_HEIGHT);
  });
});
