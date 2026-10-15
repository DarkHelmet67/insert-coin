import { describe, expect, it } from 'vitest';
import { buildAttackWaves, type WaveEntry } from './attack-waves';
import { randomBytes } from './random';
import { RANK } from './stage-setup';

/** The aliens of a token list. */
const entries = (stage: number, seed = 1): readonly WaveEntry[] =>
  buildAttackWaves(stage, RANK.A, randomBytes(seed), false).tokens.filter(
    (t): t is WaveEntry => typeof t === 'object',
  );

describe('attack waves', () => {
  it('brings the 40 aliens of stage 1 in five waves of 8', () => {
    const { tokens } = buildAttackWaves(1, RANK.A, randomBytes(1), false);
    expect(tokens.filter((t) => t === 'start')).toHaveLength(5);
    expect(tokens.at(-1)).toBe('end');
    expect(entries(1)).toHaveLength(40);
    expect(entries(1).slice(0, 2)).toEqual([
      { control: 0x00, object: 0x58 },
      { control: 0xc0, object: 0x28 },
    ]);
  });

  it('adds special enemies from stage 4 on', () => {
    const transients = entries(4).filter((e) => (e.object & 0x38) === 0x38);
    // Stage 4 of rank A: 2 + 2 + 2 transients in waves 1, 4 and 5 (byte 0 = $82, $02, $02).
    expect(transients).toHaveLength(6);
    expect(entries(4)).toHaveLength(46);
  });

  it('places the special enemies where the random bytes say', () => {
    const a = entries(9, 1).map((e) => e.object);
    const b = entries(9, 2).map((e) => e.object);
    expect(a.slice().sort()).toEqual(b.slice().sort());
  });

  it('brings a captured fighter with the last wave', () => {
    const { tokens } = buildAttackWaves(2, RANK.A, randomBytes(1), true);
    expect(tokens.at(-2)).toMatchObject({ object: 0x04 });
  });
});
