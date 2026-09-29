import { describe, expect, it } from 'vitest';
import { noControls } from './controls';
import { initialGameState, updateGame } from './game';

describe('updateGame', () => {
  it('starts in color with a full wall and no points', () => {
    expect(initialGameState).toMatchObject({ colorMode: 'color', score: 0, ball: 1 });
    expect(initialGameState.wall.every(Boolean)).toBe(true);
  });

  it('switches between mono and color', () => {
    const mono = updateGame(initialGameState, { ...noControls, colorMode: true });
    expect(mono.colorMode).toBe('mono');
    expect(updateGame(mono, noControls).colorMode).toBe('mono');
  });
});
