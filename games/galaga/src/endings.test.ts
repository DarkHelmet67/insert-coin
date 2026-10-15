import { describe, expect, it } from 'vitest';
import { hitRatio, scriptLines } from './endings';
import { addPoints, nextBonus } from './extra-lives';
import { emptyPlayingState } from './playing';

describe('hit-miss ratio', () => {
  it('has one rounded decimal and no leading zeros', () => {
    expect(hitRatio(33, 97)).toBe('34.0 %');
    expect(hitRatio(2, 3)).toBe('66.7 %');
    expect(hitRatio(1, 400)).toBe('.3 %');
    expect(hitRatio(0, 0)).toBe('.0 %');
    expect(hitRatio(5, 5)).toBe('100.0 %');
  });
});

describe('extra fighters', () => {
  const state = emptyPlayingState({ step: 'running' });

  it('come at 20 000, 70 000, then every 70 000 points', () => {
    expect([2, 7, 14, 21].map(nextBonus)).toEqual([7, 14, 21, 28]);
    const first = addPoints({ ...state, score: 19950 }, 100);
    expect(first).toMatchObject({ score: 20050, reserve: state.reserve + 1, nextBonus: 7 });
    expect(first.sounds).toContain('extraLife');
    expect(addPoints(first, 100).reserve).toBe(first.reserve);
  });
});

describe('challenge results', () => {
  const state = { ...emptyPlayingState({ step: 'running' }), flyingHits: 25 };

  it('give 100 points per hit', () => {
    const shown = scriptLines('challenge', state).reduce((s, line) => line.run(s), state);
    expect(shown.score).toBe(2500);
  });

  it('give 10 000 points for a perfect stage', () => {
    const perfect = { ...state, flyingHits: 40 };
    const lines = scriptLines('perfect', perfect);
    expect(lines.reduce((s, line) => line.run(s), perfect).score).toBe(10000);
    expect(lines[0]?.run(perfect).sounds).toEqual(['perfect']);
  });
});
