import { describe, expect, it } from 'vitest';
import { cloneAttack } from './clone-attack';
import { DISPOSITION, objectAt, updateObject } from './objects';
import { emptyPlayingState, type PlayingState } from './playing';
import { stageParameters, RANK } from './stage-setup';

/** Stage 4 with 5 aliens left, a bee resting at $0A, the task on. */
const state: PlayingState = (() => {
  const base = emptyPlayingState({ step: 'running' });
  return {
    ...base,
    stage: 4,
    params: stageParameters(4, RANK.A),
    alive: 5,
    tasks: { ...base.tasks, clones: true, fire: true },
    objects: updateObject(base.objects, 0x0a, (o) => ({
      ...o,
      disposition: DISPOSITION.home,
      code: 0x18,
      color: 3,
      x: 100,
      y: 80,
    })),
  };
})();

/** `n` frames of the clone attack alone. */
const run = (s: PlayingState, n: number): PlayingState =>
  Array.from({ length: n }).reduce<PlayingState>((current) => cloneAttack(current), s);

describe('clone attack', () => {
  it('waits for fewer aliens than the stage parameter', () => {
    expect(cloneAttack({ ...state, alive: 10 })).toEqual({ ...state, alive: 10 });
  });

  it('chooses a resting bee, flashes it, then sends it diving with the triple bonus armed', () => {
    const chosen = cloneAttack(state);
    expect(chosen.attacks).toMatchObject({ bonusBee: 0x0a, bonusBeeTimer: 0xc0, bonusBeeColor: 5 });
    expect(chosen.sounds).toEqual(['bonusBee']);
    expect(objectAt(run(chosen, 16).objects, 0x0a).color).toBe(5);
    const launched = run(chosen, 64);
    expect(objectAt(launched.objects, 0x0a).disposition).toBe(DISPOSITION.flying);
    expect(launched).toMatchObject({ tripleLeft: 3, tripleBonus: { hundreds: 0x0a, code: 0xb8 } });
    expect(launched.tasks.clones).toBe(false);
  });
});
