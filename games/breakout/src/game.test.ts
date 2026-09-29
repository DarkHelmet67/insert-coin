import { describe, expect, it } from 'vitest';
import { attractPaddle } from './attract';
import { noControls, type Controls } from './controls';
import { initialGameState, updateGame, type GameState } from './game';
import { initialPaddle } from './paddle';

const serve: Controls = { ...noControls, serve: true };

/** A game just started from the attract mode. */
const started = updateGame(initialGameState, serve);

describe('updateGame', () => {
  it('starts in the attract mode, in color, with a full wall and no points', () => {
    expect(initialGameState).toMatchObject({ attract: true, colorMode: 'color', score: 0 });
    expect(initialGameState.wall.every(Boolean)).toBe(true);
    expect(initialGameState.paddle).toBe(attractPaddle);
  });

  it('ignores the paddle controls in the attract mode', () => {
    const moved = updateGame(initialGameState, { ...noControls, pointerX: 50 });
    expect(moved.paddle).toBe(attractPaddle);
  });

  it('starts a game on SERVE, with the record to beat', () => {
    const game = updateGame({ ...initialGameState, hiScore: 300, score: 120 }, serve);
    expect(game).toMatchObject({ attract: false, score: 0, ball: 1, recordToBeat: 300 });
    expect(game.play.phase).toBe('ready');
    expect(game.paddle).toBe(initialPaddle);
  });

  it('moves the paddle during a game', () => {
    const moved = updateGame(started, { ...noControls, pointerX: 50 });
    expect(moved.paddle.x).toBe(42);
  });

  it('raises the record with the score', () => {
    const scoring: GameState = { ...started, score: 10, hiScore: 12 };
    expect(updateGame({ ...scoring, score: 15 }, noControls).hiScore).toBe(15);
    expect(updateGame(scoring, noControls).hiScore).toBe(12);
  });

  it('goes back to the attract mode after the last ball, keeping the score', () => {
    const lastBall: GameState = {
      ...started,
      ball: 3,
      score: 42,
      play: {
        phase: 'inPlay',
        ball: {
          x: 100,
          y: 207.5,
          dirX: 1,
          dirY: 1,
          hits: 0,
          fast: false,
          outer: false,
          canHitBrick: true,
        },
      },
    };
    const over = updateGame(lastBall, noControls);
    expect(over).toMatchObject({ attract: true, score: 42, ball: 3 });
    expect(over.play.phase).toBe('ready');
  });

  it('switches between mono and color', () => {
    const mono = updateGame(initialGameState, { ...noControls, colorMode: true });
    expect(mono.colorMode).toBe('mono');
    expect(updateGame(mono, noControls).colorMode).toBe('mono');
  });
});
