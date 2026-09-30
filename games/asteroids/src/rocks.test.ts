import { describe, expect, it } from 'vitest';
import { seedRandom } from './random';
import {
  clampRockSpeed,
  entryPoint,
  EXPLOSION_START,
  newLargeRock,
  nextWaveSize,
  noRocks,
  rockCount,
  spawnWave,
  updateRockSlot,
  type Rock,
  type RockSlot,
} from './rocks';

const ROCK: Rock = {
  kind: 'rock',
  position: { x: 100, y: 6140 },
  vx: -10,
  vy: 8,
  size: 4,
  shape: 0,
};

describe('clampRockSpeed', () => {
  it('keeps speeds between 6 and 31, in either direction', () => {
    expect([0, 3, 20, 40].map(clampRockSpeed)).toEqual([6, 6, 20, 31]);
    expect([-1, -20, -40].map(clampRockSpeed)).toEqual([-6, -20, -31]);
  });
});

describe('waves', () => {
  it('grow by two rocks up to eleven', () => {
    expect([2, 4, 6, 8, 10, 11].map(nextWaveSize)).toEqual([4, 6, 8, 10, 11, 11]);
  });

  it('put the rocks in the last slots, large and moving', () => {
    const { slots } = spawnWave(4, seedRandom(7));
    expect(rockCount(slots)).toBe(4);
    expect(slots.slice(23).every((slot) => slot?.kind === 'rock' && slot.size === 4)).toBe(true);
    slots.slice(23).forEach((slot) => {
      const rock = slot as Rock;
      expect(Math.abs(rock.vx)).toBeGreaterThanOrEqual(6);
      expect(Math.abs(rock.vx)).toBeLessThanOrEqual(15);
    });
  });

  it('bring rocks in on the bottom or on the left edge', () => {
    expect(entryPoint(0b0010_1010)).toEqual({ x: 21 << 8, y: 0 });
    expect(entryPoint(0b0010_1011)).toEqual({ x: 0, y: 21 << 8 });
    // Above the top of the playfield (24 or more), the program masks the value back down.
    expect(entryPoint((30 << 1) | 1)).toEqual({ x: 0, y: (30 & 0x17) << 8 });
  });

  it('draw a different wave from a different seed', () => {
    expect(newLargeRock(seedRandom(1)).rock).not.toEqual(newLargeRock(seedRandom(2)).rock);
  });
});

describe('updateRockSlot', () => {
  it('moves a rock and wraps it around the edges', () => {
    expect((updateRockSlot(ROCK) as Rock).position).toEqual({ x: 90, y: 4 });
  });

  it('grows an explosion for about 37 frames, then frees the slot', () => {
    let slot: RockSlot = { kind: 'explosion', position: { x: 0, y: 0 }, status: EXPLOSION_START };
    let frames = 0;
    while (slot) {
      slot = updateRockSlot(slot);
      frames += 1;
    }
    expect(frames).toBeGreaterThanOrEqual(36);
    expect(frames).toBeLessThanOrEqual(39);
  });

  it('leaves free slots free', () => {
    expect(noRocks.map(updateRockSlot)).toEqual(noRocks);
  });
});
