import { describe, expect, it } from 'vitest';
import { eatsFruit, fruitDue, fruitOf, fruitRowWrites, FRUIT_POSITION } from './fruit';
import { pointsOf } from './score';

/** The fruit row's tile at `address`. */
const tileAt = (round: number, address: number) =>
  fruitRowWrites(round).tiles?.find((cell) => cell.address === address)?.value;

describe('fruit', () => {
  it('follows the table of the ROM: cherry first, key from the 13th level', () => {
    expect(pointsOf(fruitOf(0).points)).toBe(100);
    expect(pointsOf(fruitOf(1).points)).toBe(300);
    expect(pointsOf(fruitOf(12).points)).toBe(5000);
    expect(fruitOf(200)).toEqual(fruitOf(12));
  });

  it('comes out at 70 and 170 dots, once each and one at a time', () => {
    expect(fruitDue(69, [false, false], undefined)).toBeUndefined();
    expect(fruitDue(70, [false, false], undefined)).toBe(0);
    expect(fruitDue(70, [true, false], undefined)).toBeUndefined();
    expect(fruitDue(170, [true, false], undefined)).toBe(1);
    expect(fruitDue(170, [true, false], { kind: fruitOf(0), shown: false })).toBeUndefined();
  });

  it('is eaten only on its exact pixel', () => {
    const fruit = { kind: fruitOf(0), shown: true };
    expect(eatsFruit(fruit, FRUIT_POSITION)).toBe(true);
    expect(eatsFruit(fruit, { x: 0x81, y: 0x94 })).toBe(false);
    expect(eatsFruit({ ...fruit, shown: false }, FRUIT_POSITION)).toBe(false);
  });

  it('shows the fruits of the levels played at the bottom right', () => {
    expect(tileAt(0, 0x004)).toBe(0x90);
    expect(tileAt(0, 0x006)).toBe(0x40);
    expect(tileAt(1, 0x006)).toBe(0x94);
    expect(fruitRowWrites(30).tiles).toHaveLength(28);
  });

  it('runs over the maze on level 256', () => {
    const tiles = fruitRowWrites(255).tiles ?? [];
    expect(tiles.length).toBe((256 + 7) * 4);
    expect(tiles.some((cell) => cell.address >= 0x200)).toBe(true);
  });
});
