import { describe, expect, it } from 'vitest';
import { initialCannonState } from './cannon';
import { noControls } from './controls';
import { initialGameState, updateGame } from './game';

describe('updateGame', () => {
  it('waits on the attract screen until a coin is inserted', () => {
    const state = updateGame(initialGameState, noControls, 1 / 60);
    expect(state.screen).toBe('attract');
  });

  it('starts playing when a coin is inserted', () => {
    const state = updateGame(initialGameState, { ...noControls, coin: true }, 1 / 60);
    expect(state).toEqual({ screen: 'playing', cannon: initialCannonState });
  });

  it('moves the cannon while playing', () => {
    const playing = updateGame(initialGameState, { ...noControls, coin: true }, 1 / 60);
    const moved = updateGame(playing, { ...noControls, direction: 1 }, 1);
    expect(moved.screen === 'playing' && moved.cannon.x).toBeGreaterThan(initialCannonState.x);
  });
});
