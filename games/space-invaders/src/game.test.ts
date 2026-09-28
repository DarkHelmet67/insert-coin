import { describe, expect, it } from 'vitest';
import { initialCannonState } from './cannon';
import { noControls } from './controls';
import { GAME_OVER_FRAMES, initialGameState, updateGame, type GameState } from './game';
import { initialPlayingState } from './playing';

const coin = { ...noControls, coin: true };

/** The game right after a coin is inserted. */
const startGame = (): GameState => updateGame(initialGameState, coin, 1 / 60);

/** A game about to end: no cannons left and the last one done exploding. */
const lastFrame: GameState = {
  screen: 'playing',
  playing: { ...initialPlayingState(), lives: 0, cannonExplosion: 1, score: 420 },
  hiScore: 100,
  colorMode: 'color',
};

describe('updateGame', () => {
  it('waits on the attract screen until a coin is inserted', () => {
    expect(updateGame(initialGameState, noControls, 1 / 60).screen).toBe('attract');
  });

  it('starts a new game when a coin is inserted', () => {
    const state = startGame();
    expect(state.screen === 'playing' && state.playing.score).toBe(0);
  });

  it('moves the cannon while playing', () => {
    const moved = updateGame(startGame(), { ...noControls, direction: 1 }, 1 / 60);
    expect(moved.screen === 'playing' && moved.playing.cannon.x).toBeGreaterThan(
      initialCannonState.x,
    );
  });

  it('shows "game over" and keeps the best score when the game ends', () => {
    expect(updateGame(lastFrame, noControls, 1 / 60)).toMatchObject({
      screen: 'gameOver',
      hiScore: 420,
    });
  });

  it('goes back to the attract screen after the game over message', () => {
    const over = updateGame(lastFrame, noControls, 1 / 60);
    const later = Array.from({ length: GAME_OVER_FRAMES }).reduce<GameState>(
      (state) => updateGame(state, noControls, 1 / 60),
      over,
    );
    expect(later).toMatchObject({ screen: 'attract', hiScore: 420 });
  });

  it('accepts a coin during the game over message', () => {
    const over = updateGame(lastFrame, noControls, 1 / 60);
    expect(updateGame(over, coin, 1 / 60)).toMatchObject({ screen: 'playing', hiScore: 420 });
  });

  it('switches between mono and color on any screen, keeping the choice for the next game', () => {
    const mono = updateGame(initialGameState, { ...noControls, colorMode: true }, 1 / 60);
    expect(mono.colorMode).toBe('mono');
    expect(updateGame(mono, coin, 1 / 60)).toMatchObject({ screen: 'playing', colorMode: 'mono' });
  });
});
