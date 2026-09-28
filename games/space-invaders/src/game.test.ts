import { describe, expect, it } from 'vitest';
import { initialCannonState } from './cannon';
import { noControls } from './controls';
import { initialGameState, updateGame, type GameState } from './game';

/** The game right after a coin is inserted. */
const startGame = (): GameState =>
  updateGame(initialGameState, { ...noControls, coin: true }, 1 / 60);

describe('updateGame', () => {
  it('waits on the attract screen until a coin is inserted', () => {
    expect(updateGame(initialGameState, noControls, 1 / 60).screen).toBe('attract');
  });

  it('starts a new game when a coin is inserted', () => {
    const state = startGame();
    expect(state.screen === 'playing' && state.playing.score).toBe(0);
  });

  it('moves the cannon while playing', () => {
    const moved = updateGame(startGame(), { ...noControls, direction: 1 }, 1);
    expect(moved.screen === 'playing' && moved.playing.cannon.x).toBeGreaterThan(
      initialCannonState.x,
    );
  });
});
