import { describe, expect, it } from 'vitest';
import { TEXT, textWrites } from './texts';
import { cellAddress } from './video';

/** The letters of a message, read back from its tile codes. */
const letters = (number: number): string =>
  String.fromCharCode(...(textWrites(number).tiles ?? []).map((write) => write.value));

describe('textWrites', () => {
  it('writes READY! in yellow under the ghost house', () => {
    const writes = textWrites(TEXT.ready);
    expect(letters(TEXT.ready)).toBe('READY[');
    expect(writes.tiles?.[0]?.address).toBe(cellAddress(11, 20));
    expect(writes.tiles?.[5]?.address).toBe(cellAddress(16, 20));
    expect(writes.colors?.every((write) => write.value === 9)).toBe(true);
  });

  it('writes HIGH SCORE along the top row', () => {
    expect(letters(TEXT.highScore)).toBe('HIGH@SCORE');
    expect(textWrites(TEXT.highScore).tiles?.[9]?.address).toBe(cellAddress(18, 0));
  });

  it('erases a message with spaces', () => {
    expect(textWrites(TEXT.gameOver, true).tiles?.every((write) => write.value === 0x40)).toBe(
      true,
    );
  });
});
