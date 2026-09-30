import { describe, expect, it } from 'vitest';
import {
  beamAlpha,
  drawBeamLines,
  groupByBrightness,
  widthInPixels,
  type BeamContext,
  type BeamStyle,
} from './beam';
import { fitViewport } from './viewport';

const STYLE: BeamStyle = {
  color: '#fff',
  glowColor: 'rgba(255, 255, 255, 0.5)',
  coreWidth: 1,
  glowBlur: 4,
  dotSize: 2,
  maxBrightness: 15,
  gamma: 1,
};

/** A fake context that records the calls, so the drawing can be checked without a browser. */
const createRecordingContext = () => {
  const calls: string[] = [];
  /** Returns a method that records its name and arguments. */
  const record =
    (name: string) =>
    (...args: readonly number[]) => {
      calls.push(`${name}(${args.map((arg) => String(Math.round(arg))).join(',')})`);
    };
  const ctx = {
    calls,
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowBlur: 0,
    shadowColor: '',
    beginPath: record('beginPath'),
    moveTo: record('moveTo'),
    lineTo: record('lineTo'),
    arc: record('arc'),
    stroke: () => calls.push(`stroke(${String(ctx.globalAlpha)})`),
    fill: record('fill'),
  };
  return ctx as typeof ctx & BeamContext;
};

const mapping = fitViewport({ left: 0, bottom: 0, width: 100, height: 100 }, 100, 100);

describe('beamAlpha', () => {
  it('goes from 0 (off) to 1 (brightest)', () => {
    expect(beamAlpha(STYLE, 0)).toBe(0);
    expect(beamAlpha(STYLE, 15)).toBe(1);
  });

  it('lifts dim lines with a gamma below 1', () => {
    expect(beamAlpha({ ...STYLE, gamma: 0.5 }, 7)).toBeGreaterThan(beamAlpha(STYLE, 7));
  });
});

describe('widthInPixels', () => {
  it('grows with the canvas and never goes below one pixel', () => {
    expect(widthInPixels(2, { ...mapping, scale: 3 })).toBe(6);
    expect(widthInPixels(2, { ...mapping, scale: 0.25 })).toBe(1);
  });
});

describe('groupByBrightness', () => {
  it('keeps the lines of each brightness together', () => {
    const dim = { x1: 0, y1: 0, x2: 1, y2: 1, brightness: 7 };
    const bright = { ...dim, brightness: 12 };
    expect([...groupByBrightness([dim, bright, dim]).entries()]).toEqual([
      [7, [dim, dim]],
      [12, [bright]],
    ]);
  });
});

describe('drawBeamLines', () => {
  it('strokes each brightness once, with y turned upside down', () => {
    const ctx = createRecordingContext();
    const line = { x1: 10, y1: 10, x2: 90, y2: 10, brightness: 15 };
    drawBeamLines(ctx, [line, line, { ...line, brightness: 3 }], mapping, STYLE);
    const strokes = ctx.calls.filter((call) => call.startsWith('stroke'));
    expect(strokes).toEqual(['stroke(1)', 'stroke(0.2)']);
    expect(ctx.calls).toContain('moveTo(10,90)');
    expect(ctx.calls).toContain('lineTo(90,90)');
    expect(ctx.globalCompositeOperation).toBe('source-over');
    expect(ctx.shadowBlur).toBe(0);
  });

  it('draws dots as small circles', () => {
    const ctx = createRecordingContext();
    drawBeamLines(ctx, [{ x1: 50, y1: 50, x2: 50, y2: 50, brightness: 15 }], mapping, STYLE);
    expect(ctx.calls.filter((call) => call.startsWith('arc'))).toEqual(['arc(50,50,1,0,6)']);
  });

  it('skips lines that are off', () => {
    const ctx = createRecordingContext();
    drawBeamLines(ctx, [{ x1: 0, y1: 0, x2: 9, y2: 9, brightness: 0 }], mapping, STYLE);
    expect(ctx.calls).toEqual([]);
  });
});
