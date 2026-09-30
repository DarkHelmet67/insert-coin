import { describe, expect, it } from 'vitest';
import { createGameState, type GameState } from './game';
import { messageLines, visibleMessages } from './messages';
import { seedRandom } from './random';

const start = createGameState(seedRandom(1));
const playing: GameState = { ...start, delay: 0, life: { kind: 'flying' } };

describe('visibleMessages', () => {
  it('shows "PLAYER 1" at the start only', () => {
    expect(visibleMessages(start)).toEqual(['player']);
    expect(visibleMessages(playing)).toEqual([]);
  });

  it('shows "GAME OVER" when the last ship is lost', () => {
    expect(visibleMessages({ ...playing, lives: 0 })).toEqual(['gameOver']);
  });

  it('blinks "PUSH START" after the game', () => {
    const over: GameState = { ...playing, lives: 0, phase: 'over' };
    expect(visibleMessages({ ...over, frame: 0 })).toEqual(['pushStart']);
    expect(visibleMessages({ ...over, frame: 0x20 })).toEqual([]);
  });
});

describe('messageLines', () => {
  it('writes the message at twice the font size', () => {
    const xs = messageLines(start).flatMap((line) => [line.x1, line.x2]);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(400);
    // "PLAYER 1": 8 characters 24 units apart.
    expect(Math.max(...xs)).toBeGreaterThan(400 + 7 * 24);
  });
});
