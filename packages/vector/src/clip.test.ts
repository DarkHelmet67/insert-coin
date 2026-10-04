import { describe, expect, it } from 'vitest';
import { clipLine, clipLines, DVG_CLIP } from './clip';

/** A line of brightness 7 from (x1, y1) to (x2, y2). */
const line = (x1: number, y1: number, x2: number, y2: number) => ({
  x1,
  y1,
  x2,
  y2,
  brightness: 7,
});

describe('clipLine', () => {
  it('keeps a line that is all inside', () => {
    expect(clipLine(line(10, 10, 100, 50), DVG_CLIP)).toEqual(line(10, 10, 100, 50));
  });

  it('drops a line that is all outside', () => {
    expect(clipLine(line(-50, 10, -10, 20), DVG_CLIP)).toBeNull();
    expect(clipLine(line(10, 1100, 50, 1200), DVG_CLIP)).toBeNull();
  });

  it('cuts a line where it crosses the border', () => {
    expect(clipLine(line(-100, 0, 100, 200), DVG_CLIP)).toEqual(line(0, 100, 100, 200));
    expect(clipLine(line(1000, 500, 1100, 500), DVG_CLIP)).toEqual(line(1000, 500, 1023, 500));
  });

  it('keeps a dot inside and drops one outside', () => {
    expect(clipLine(line(5, 5, 5, 5), DVG_CLIP)).toEqual(line(5, 5, 5, 5));
    expect(clipLine(line(-5, 5, -5, 5), DVG_CLIP)).toBeNull();
  });
});

describe('clipLines', () => {
  it('clips every line and leaves out the invisible ones', () => {
    const lines = [line(-100, 0, 100, 200), line(-50, 10, -10, 20)];
    expect(clipLines(lines, DVG_CLIP)).toEqual([line(0, 100, 100, 200)]);
  });
});
