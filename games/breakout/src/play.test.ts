import { describe, expect, it } from 'vitest';
import type { Ball } from './ball';
import { initialPaddle } from './paddle';
import { fullWall } from './bricks';
import { newRound, secondWallDue, updateRound, type Round } from './play';

/** A round with the ball in play at `changes`. */
const inPlay = (changes: Partial<Ball>, round: Partial<Round> = {}): Round => ({
  ...newRound(),
  ...round,
  play: {
    phase: 'inPlay',
    ball: {
      x: 100,
      y: 120,
      dirX: 1,
      dirY: 1,
      hits: 0,
      fast: false,
      outer: false,
      canHitBrick: true,
      ...changes,
    },
  },
});

describe('updateRound', () => {
  it('waits for SERVE, then for the hidden ball to come round', () => {
    const ready = newRound();
    expect(updateRound(ready, initialPaddle, false, 10)).toBe(ready);
    const serving = updateRound(ready, initialPaddle, true, 250);
    expect(serving.play).toEqual({ phase: 'serving', framesLeft: 6, pressedAt: 250 });
  });

  it('shows the ball when the wait is over', () => {
    const round: Round = { ...newRound(), play: { phase: 'serving', framesLeft: 0, pressedAt: 3 } };
    expect(updateRound(round, initialPaddle, false, 0).play.phase).toBe('inPlay');
  });

  it('scores the bricks the ball breaks', () => {
    const round = inPlay({ x: 50, y: 72, dirY: -1 });
    expect(updateRound(round, initialPaddle, false, 0).score).toBe(1);
  });

  it('moves on to the next ball when one is lost', () => {
    const next = updateRound(inPlay({ y: 207.5 }), initialPaddle, false, 0);
    expect(next).toMatchObject({ ball: 2, play: { phase: 'ready' } });
  });

  it('halves the paddle when the ball touches the top wall, until the next ball', () => {
    const shrunk = updateRound(inPlay({ y: 8.5, dirY: -1 }), initialPaddle, false, 0);
    expect(shrunk.shrunk).toBe(true);
    const next = updateRound(inPlay({ y: 207.5 }, { shrunk: true }), initialPaddle, false, 0);
    expect(next.shrunk).toBe(false);
  });

  it('brings the second wall at the first paddle hit after 448 points, only once', () => {
    const cleared = { ...newRound(), wall: fullWall().map(() => false), score: 448 };
    expect(secondWallDue(cleared, true)).toBe(true);
    expect(secondWallDue(cleared, false)).toBe(false);
    expect(secondWallDue({ ...cleared, refilled: true }, true)).toBe(false);
    expect(secondWallDue({ ...cleared, score: 447 }, true)).toBe(false);

    const paddleHit = updateRound(
      inPlay({ x: initialPaddle.x + 6, y: 187 }, { wall: cleared.wall, score: 448 }),
      initialPaddle,
      false,
      0,
    );
    expect(paddleHit.refilled).toBe(true);
    expect(paddleHit.wall.filter(Boolean)).toHaveLength(112);
  });

  it('ends the game after the last ball, keeping the score', () => {
    const over = updateRound(inPlay({ y: 207.5 }, { ball: 3, score: 40 }), initialPaddle, false, 0);
    expect(over.play.phase).toBe('gameOver');
    expect(updateRound(over, initialPaddle, true, 0)).toMatchObject({ score: 40, ball: 3 });
  });
});
