import { describe, expect, it } from 'vitest';
import { createFormation, FORMATION_COLUMNS, FORMATION_ROWS, startBottomY } from './aliens';

describe('createFormation', () => {
  it('has 55 invaders: 5 rows of 11', () => {
    expect(createFormation()).toHaveLength(FORMATION_ROWS.length * FORMATION_COLUMNS);
  });

  it('lists them in marching order: bottom row first, left to right', () => {
    const formation = createFormation();
    expect(formation[0]).toMatchObject({ kind: 'octopus', column: 1, y: 128 });
    expect(formation[1]?.column).toBe(2);
    expect(formation.at(-1)).toMatchObject({ kind: 'squid', column: 11, y: 128 - 4 * 16 });
  });

  it('centers narrow invaders in their column', () => {
    const formation = createFormation();
    const octopus = formation[0];
    const squid = formation.at(-FORMATION_COLUMNS);
    expect(squid && octopus && squid.x - octopus.x).toBe(2);
  });

  it('starts one row lower in round 2, as in the original table', () => {
    expect([1, 2, 3].map(startBottomY)).toEqual([128, 152, 168]);
    expect(createFormation(2)[0]?.y).toBe(startBottomY(2));
  });

  it('never starts below 184, and starts over from round 2 height at round 10', () => {
    expect(Math.max(...Array.from({ length: 20 }, (_, i) => startBottomY(i + 1)))).toBe(184);
    expect(startBottomY(10)).toBe(startBottomY(2));
  });
});
