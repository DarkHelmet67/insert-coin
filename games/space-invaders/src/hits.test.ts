import { describe, expect, it } from 'vitest';
import type { Alien } from './aliens';
import { findHitAlien } from './hits';

const octopus: Alien = { kind: 'octopus', x: 100, y: 100 };

describe('findHitAlien', () => {
  it('finds the invader touched by the shot', () => {
    expect(findHitAlien({ x: 105, y: 102 }, [octopus])).toBe(octopus);
  });

  it('misses a shot passing through an empty part of the sprite', () => {
    // Column 4 of the octopus is empty in its last two rows (between the legs): a shot there
    // overlaps the bounding box but touches no lit pixel.
    expect(findHitAlien({ x: 104, y: 106 }, [octopus])).toBeUndefined();
  });

  it('misses a shot outside the invader', () => {
    expect(findHitAlien({ x: 90, y: 102 }, [octopus])).toBeUndefined();
  });
});
