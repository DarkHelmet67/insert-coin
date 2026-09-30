import { describe, expect, it } from 'vitest';
import { VIEWPORT } from './playfield';
import { hudLines, livesLines, scoreText } from './hud';

describe('scoreText', () => {
  it('writes the score with its fixed last zero, right-aligned on five characters', () => {
    expect(scoreText(0)).toBe('   00');
    expect(scoreText(1230)).toBe(' 1230');
    expect(scoreText(99990)).toBe('99990');
  });
});

describe('livesLines', () => {
  it('draws one five-line icon per life, 16 units apart', () => {
    const lines = livesLines(3);
    expect(lines).toHaveLength(15);
    expect(lines[5]?.x1).toBeCloseTo((lines[0]?.x1 ?? 0) + 16);
  });

  it('draws nothing without lives', () => {
    expect(livesLines(0)).toEqual([]);
  });
});

describe('hudLines', () => {
  it('keeps everything inside what the monitor shows', () => {
    const lines = hudLines(12340, 99990, 4);
    const ys = lines.flatMap((line) => [line.y1, line.y2]);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(VIEWPORT.bottom);
    expect(Math.max(...ys)).toBeLessThanOrEqual(VIEWPORT.bottom + VIEWPORT.height);
  });
});
