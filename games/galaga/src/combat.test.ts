import { describe, expect, it } from 'vitest';
import { noControls } from './controls';
import { FIGHTER, objectAt } from './objects';
import { emptyPlayingState, type PlayingState } from './playing';
import { startIntro } from './program';
import { updatePlaying } from './update-playing';

/** A game at its first frame. */
const newGame = startIntro(emptyPlayingState({ step: 'intro' }));

/** `frames` frames of play, firing every 8 frames and sweeping left and right. */
const simulate = (frames: number): readonly PlayingState[] =>
  Array.from({ length: frames }).reduce<readonly PlayingState[]>(
    (states, _, f) => {
      const state = states.at(-1) ?? newGame;
      const direction = ((f >> 7) & 1) === 0 ? 1 : -1;
      return [...states, updatePlaying(state, { ...noControls, direction, fire: f % 8 === 0 })];
    },
    [newGame],
  );

describe('a simulated game', () => {
  const states = simulate(3000);
  const last = states.at(-1) ?? newGame;

  it('scores points by shooting aliens', () => {
    expect(last.score).toBeGreaterThan(0);
    expect(last.hits).toBeGreaterThan(0);
  });

  it('sends aliens diving and dropping bombs', () => {
    expect(states.some((s) => s.sounds.includes('dive'))).toBe(true);
    expect(states.some((s) => s.objects.slice(0x34, 0x3c).some((b) => b.x !== 0))).toBe(true);
  });

  it('loses the fighter, which then explodes', () => {
    const lost = states.findIndex((s) => s.sounds.includes('fighterExplosion'));
    expect(lost).toBeGreaterThan(0);
    expect(objectAt(states[lost]?.objects ?? [], FIGHTER).code).toBe(0x20);
  });
});
