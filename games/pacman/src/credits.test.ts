import { describe, expect, it } from 'vitest';
import { creditWrites, pushStartVideo, upWrites } from './credits';
import { TEXT } from './texts';
import { ROM_TEXTS } from './rom/texts';
import { filledVideo } from './video';

/** The tile last written at `address`, if any: the last write wins. */
const tileAt = (writes: ReturnType<typeof upWrites>, address: number): number | undefined =>
  [...(writes.tiles ?? [])].reverse().find((cell) => cell.address === address)?.value;

describe('credits and labels', () => {
  it('writes "CREDIT" and the units, and the tens only when there are some', () => {
    const one = creditWrites(1);
    expect(tileAt(one, 0x033)).toBe(0x31);
    expect(tileAt(one, 0x034)).toBe(0x40);
    const twelve = creditWrites(12);
    expect(tileAt(twelve, 0x034)).toBe(0x31);
    expect(tileAt(twelve, 0x033)).toBe(0x32);
    expect(tileAt(twelve, 0x03b)).toBe(0x43);
  });

  it('shows "1UP" and "2UP" before a game, and in a game blinks "1UP" alone', () => {
    expect(tileAt(upWrites(false, 0x10), 0x3da)).toBe(0x31);
    expect(tileAt(upWrites(false, 0x10), 0x3c7)).toBe(0x32);
    expect(tileAt(upWrites(true, 0x00), 0x3da)).toBe(0x31);
    expect(tileAt(upWrites(true, 0x10), 0x3da)).toBe(0x40);
    expect(tileAt(upWrites(true, 0x00), 0x3c7)).toBe(0x40);
  });

  it('asks to push start, with the bonus life of the setting', () => {
    const video = pushStartVideo(filledVideo(0x40, 0), 0);
    const pushStart = ROM_TEXTS[TEXT.pushStart];
    expect(video.tiles[pushStart?.offset ?? 0]).toBe(pushStart?.tiles[0]);
    expect(video.tiles[0x156]).toBe(0x31);
    expect(video.tiles[0x136]).toBe(0x30);
    const none = pushStartVideo(filledVideo(0x40, 0), 3);
    expect(none.tiles[ROM_TEXTS[TEXT.bonusPacMan]?.offset ?? 0]).toBe(0x40);
  });
});
