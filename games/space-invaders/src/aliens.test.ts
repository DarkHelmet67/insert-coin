import { describe, expect, it } from 'vitest';
import { createFormation, FORMATION_COLUMNS, FORMATION_ROWS } from './aliens';

describe('createFormation', () => {
  it('has 55 invaders: 5 rows of 11', () => {
    expect(createFormation()).toHaveLength(FORMATION_ROWS.length * FORMATION_COLUMNS);
  });

  it('puts the squids on top and the octopuses at the bottom', () => {
    const formation = createFormation();
    expect(formation[0]?.kind).toBe('squid');
    expect(formation.at(-1)?.kind).toBe('octopus');
  });

  it('centers narrow invaders in their column', () => {
    const [squid] = createFormation();
    const octopus = createFormation().at(-FORMATION_COLUMNS);
    expect(squid && octopus && squid.x - octopus.x).toBe(2);
  });
});
