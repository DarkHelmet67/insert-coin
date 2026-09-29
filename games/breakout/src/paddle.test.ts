import { describe, expect, it } from 'vitest';
import { noControls } from './controls';
import { initialPaddle, movePaddle, paddleWidth } from './paddle';
import { RIGHT_WALL_X, SIDE_WALL_WIDTH } from './playfield';
import { tuning } from './tuning.config';

describe('movePaddle', () => {
  it('starts in the middle, full width', () => {
    expect(initialPaddle.width).toBe(16);
    expect(initialPaddle.x + initialPaddle.width / 2).toBe(114);
  });

  it('centers the paddle on the pointer, like the knob of the cabinet', () => {
    expect(movePaddle(initialPaddle, { ...noControls, pointerX: 50 }).x).toBe(42);
  });

  it('moves with the keys when the pointer is still', () => {
    const moved = movePaddle(initialPaddle, { ...noControls, direction: 1 });
    expect(moved.x).toBe(initialPaddle.x + tuning.paddleKeySpeed);
  });

  it('stops at the side walls', () => {
    expect(movePaddle(initialPaddle, { ...noControls, pointerX: -40 }).x).toBe(SIDE_WALL_WIDTH);
    expect(movePaddle(initialPaddle, { ...noControls, pointerX: 400 }).x).toBe(RIGHT_WALL_X - 16);
  });

  it('is 16 lines wide, 8 after a breakout', () => {
    expect(paddleWidth(false)).toBe(16);
    expect(paddleWidth(true)).toBe(8);
  });

  it('snaps to whole scan lines', () => {
    expect(Number.isInteger(movePaddle(initialPaddle, { ...noControls, pointerX: 50.7 }).x)).toBe(
      true,
    );
  });
});
