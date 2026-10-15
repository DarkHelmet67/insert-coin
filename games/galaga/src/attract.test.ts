import { describe, expect, it } from 'vitest';
import { newAttract, updateAttract, type Attract } from './attract';
import { objectAt } from './objects';

/** The attract screen after `frames` frames. */
const after = (frames: number): Attract =>
  Array.from({ length: frames }).reduce<Attract>((a) => updateAttract(a), newAttract());

describe('the attract screen', () => {
  it('writes the info screen one line about every second', () => {
    expect(after(30).messages).toEqual([]);
    expect(after(70).messages.map((m) => m.text)).toEqual(['GALAGA']);
    expect(after(200).messages.map((m) => m.text)).toEqual(['GALAGA', '-- SCORE --', '50    100']);
  });

  it('shows the aliens of the score table, upright, from the third line', () => {
    const shown = after(330);
    expect(objectAt(shown.objects, 0x08)).toMatchObject({ code: 0x1e, color: 3, x: 0x44, y: 0x74 });
    expect(objectAt(shown.objects, 0x0c)).toMatchObject({ code: 0x0e, x: 0x7c, y: 0xa0 });
  });

  it('ends with the copyright, then starts again', () => {
    const copyright = after(400);
    expect(copyright.step).toBe('copyright');
    expect(copyright.messages.at(-1)?.text).toBe('© 1981 NAMCO LTD.');
    expect(after(700).step).toBe('info');
    expect(after(700).messages).toHaveLength(0);
  });
});
