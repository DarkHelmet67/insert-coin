import { describe, expect, it } from 'vitest';
import { noControls } from './controls';
import { initialGameState, updateGame } from './game';

describe('updateGame', () => {
  it('counts frames from 0 to 255 and starts again', () => {
    expect(updateGame(initialGameState, noControls).frame).toBe(1);
    expect(updateGame({ ...initialGameState, frame: 255 }, noControls).frame).toBe(0);
  });

  it('moves the ship with the controls', () => {
    const next = updateGame(initialGameState, { turn: 1, thrust: false });
    expect(next.ship.direction).toBe(3);
  });
});
