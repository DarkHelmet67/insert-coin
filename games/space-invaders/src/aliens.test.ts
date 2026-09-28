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

  it('starts lower in later rounds', () => {
    expect(startBottomY(2)).toBeGreaterThan(startBottomY(1));
    expect(createFormation(2)[0]?.y).toBe(startBottomY(2));
  });

  it('repeats the start heights after round 8', () => {
    expect(startBottomY(9)).toBe(startBottomY(1));
  });
});
