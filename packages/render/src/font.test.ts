import { describe, expect, it } from 'vitest';
import { arcadeFont } from './arcade-font';
import { createPixelFont, drawCenteredText, drawText, textWidth } from './font';
import { createRecordingContext } from './test-context';

/** A 1×1 font where every glyph is a single lit pixel: easy to reason about in tests. */
const dotFont = createPixelFont(
  { A: ['X'], B: ['X'] },
  { glyphWidth: 1, glyphHeight: 1, spacing: 1 },
);

describe('createPixelFont', () => {
  it('rejects glyphs of the wrong size', () => {
    expect(() => createPixelFont({ A: ['XX'] }, { glyphWidth: 1, glyphHeight: 1 })).toThrow(
      'Glyph "A"',
    );
  });
});

describe('textWidth', () => {
  it('counts glyphs and the spacing between them, not after the last one', () => {
    expect(textWidth(dotFont, 'AB')).toBe(3);
    expect(textWidth(dotFont, '')).toBe(0);
  });
});

describe('drawText', () => {
  it('places each glyph after the previous one', () => {
    const ctx = createRecordingContext();
    drawText(ctx, dotFont, 'AB', 10, 0, '#fff');
    expect(ctx.rects.map((rect) => rect.x)).toEqual([10, 12]);
  });

  it('writes lowercase text in uppercase and skips unknown characters', () => {
    const ctx = createRecordingContext();
    drawText(ctx, dotFont, 'a?b', 0, 0, '#fff');
    expect(ctx.rects.map((rect) => rect.x)).toEqual([0, 4]);
  });
});

describe('drawCenteredText', () => {
  it('centers the text on the screen', () => {
    const ctx = createRecordingContext(11, 10);
    drawCenteredText(ctx, dotFont, 'AB', 0, '#fff');
    expect(ctx.rects.map((rect) => rect.x)).toEqual([4, 6]);
  });
});

describe('arcadeFont', () => {
  it('has every letter and digit', () => {
    const missing = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'].filter(
      (char) => !arcadeFont.glyphs.has(char),
    );
    expect(missing).toEqual([]);
  });
});
