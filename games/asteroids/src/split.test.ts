import { describe, expect, it } from 'vitest';
import { seedRandom } from './random';
import { noRocks, ROCK_SLOTS, type Rock, type RockSlot } from './rocks';
import { freeRockSlot, splitRock } from './split';

const LARGE: Rock = {
  kind: 'rock',
  position: { x: 4000, y: 3000 },
  vx: 20,
  vy: -10,
  size: 4,
  shape: 1,
};

/** Slots with `rock` at `index` and the rest free. */
const withRock = (rock: Rock, index: number): readonly RockSlot[] =>
  noRocks.map((slot, i) => (i === index ? rock : slot));

describe('freeRockSlot', () => {
  it('searches downwards from a slot', () => {
    const slots = withRock(LARGE, 26);
    expect(freeRockSlot(slots, 26)).toBe(25);
    expect(
      freeRockSlot(
        noRocks.map(() => LARGE),
        26,
      ),
    ).toBe(-1);
  });
});

describe('splitRock', () => {
  it('turns a large rock into an explosion and two medium rocks', () => {
    const { slots } = splitRock(withRock(LARGE, 26), 26, seedRandom(3));
    expect(slots[26]).toMatchObject({ kind: 'explosion', status: 0xa0 });
    const children = slots.filter((slot): slot is Rock => slot?.kind === 'rock');
    expect(children).toHaveLength(2);
    children.forEach((child) => {
      expect(child.size).toBe(2);
      expect(Math.abs(child.vx)).toBeGreaterThanOrEqual(6);
      expect(Math.abs(child.vx)).toBeLessThanOrEqual(31);
    });
  });

  it('starts the children at the parent, one nudged sideways and one vertically', () => {
    const { slots } = splitRock(withRock(LARGE, 10), 10, seedRandom(3));
    const [first, second] = [slots[26], slots[25]] as [Rock, Rock];
    expect(first.position.y).toBe(LARGE.position.y);
    expect(Math.abs(first.position.x - LARGE.position.x)).toBeLessThan(256);
    expect(second.position.x).toBe(LARGE.position.x);
    expect(Math.abs(second.position.y - LARGE.position.y)).toBeLessThan(256);
  });

  it('leaves only an explosion for a small rock', () => {
    const small: Rock = { ...LARGE, size: 1 };
    const { slots } = splitRock(withRock(small, 5), 5, seedRandom(3));
    expect(slots.filter(Boolean)).toEqual([
      { kind: 'explosion', position: small.position, status: 0xa0 },
    ]);
  });

  it('breaks a rock without children when every slot is taken', () => {
    const full = Array.from({ length: ROCK_SLOTS }, () => LARGE);
    const { slots } = splitRock(full, 0, seedRandom(3));
    expect(slots.filter((slot) => slot?.kind === 'rock')).toHaveLength(ROCK_SLOTS - 1);
    expect(slots[0]?.kind).toBe('explosion');
  });
});
