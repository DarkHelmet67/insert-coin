import { describe, expect, it } from 'vitest';
import { DIGIT_SEGMENTS, drawSegmentDigit, drawSegmentNumber, segmentBox } from './seven-segment';
import { createRecordingContext } from './test-context';

const style = { width: 10, height: 14, strokeX: 2, strokeY: 2 };

describe('seven-segment digits', () => {
  it('lights all seven segments for 8 and two for 1', () => {
    expect(DIGIT_SEGMENTS['8']).toHaveLength(7);
    expect(DIGIT_SEGMENTS['1']).toEqual(['b', 'c']);
  });

  it('places the middle segment halfway and the bottom one at the base', () => {
    expect(segmentBox('g', style)).toEqual({ x: 0, y: 6, width: 10, height: 2 });
    expect(segmentBox('d', style)).toEqual({ x: 0, y: 12, width: 10, height: 2 });
  });

  it('makes the upper and lower vertical segments meet the middle one', () => {
    const upper = segmentBox('f', style);
    const lower = segmentBox('e', style);
    expect(upper.y + upper.height).toBe(8);
    expect(lower.y + lower.height).toBe(14);
  });

  it('draws one rectangle per lit segment, offset to the digit position', () => {
    const ctx = createRecordingContext();
    drawSegmentDigit(ctx, '1', 20, 30, style, '#fff');
    expect(ctx.rects).toEqual([
      { x: 28, y: 30, width: 2, height: 8, color: '#fff' },
      { x: 28, y: 36, width: 2, height: 8, color: '#fff' },
    ]);
  });

  it('draws numbers one digit every pitch pixels and skips unknown characters', () => {
    const ctx = createRecordingContext();
    drawSegmentNumber(ctx, '1 1', 0, 0, 16, style, '#fff');
    expect(ctx.rects.map((rect) => rect.x)).toEqual([8, 8, 40, 40]);
  });
});
