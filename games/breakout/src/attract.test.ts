import { describe, expect, it } from 'vitest';
import { updateAttract } from './attract';
import { newRound, type Round } from './play';

/** Runs the attract mode for `frames` frames. */
const run = (round: Round, frames: number): Round =>
  Array.from({ length: frames }).reduce<Round>(
    (next, _, clock) => updateAttract(next, clock),
    round,
  );

describe('updateAttract', () => {
  it('serves by itself', () => {
    expect(updateAttract(newRound(), 0).play.phase).toBe('serving');
    expect(run(newRound(), 300).play.phase).toBe('inPlay');
  });

  it('never breaks a brick, scores or loses the ball', () => {
    const start = { ...newRound(), score: 123 };
    const after = run(start, 5000);
    expect(after.wall).toBe(start.wall);
    expect(after.score).toBe(123);
    expect(after.ball).toBe(1);
    expect(after.play.phase).toBe('inPlay');
  });
});
