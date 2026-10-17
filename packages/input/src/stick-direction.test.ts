import { describe, expect, it } from 'vitest';
import { centered, shownOffset, stickKeys, stickOffset } from './stick-direction';

const center = { x: 100, y: 100 };

describe('stickOffset', () => {
  it('measures the finger from the centre, in radii', () => {
    expect(stickOffset({ x: 125, y: 70 }, center, 50)).toEqual({ x: 0.5, y: -0.6 });
  });

  it('keeps the knob on the edge when the finger leaves the base', () => {
    const { x, y } = stickOffset({ x: 400, y: 100 }, center, 50);
    expect(x).toBeCloseTo(1);
    expect(y).toBeCloseTo(0);
    const diagonal = stickOffset({ x: 200, y: 200 }, center, 50);
    expect(Math.hypot(diagonal.x, diagonal.y)).toBeCloseTo(1);
  });

  it('stays centred on a base with no size', () => {
    expect(stickOffset({ x: 120, y: 80 }, center, 0)).toBe(centered);
  });
});

describe('stickKeys', () => {
  it('holds nothing inside the dead zone', () => {
    expect([...stickKeys({ x: 0.2, y: 0.1 }, 'four-way', 0.3)]).toEqual([]);
    expect([...stickKeys({ x: -0.2, y: 0.9 }, 'left-right', 0.3)]).toEqual([]);
  });

  it('reads only the sideways push on a left-right stick', () => {
    expect([...stickKeys({ x: -0.5, y: 0.8 }, 'left-right', 0.3)]).toEqual(['ArrowLeft']);
    expect([...stickKeys({ x: 0.4, y: -0.9 }, 'left-right', 0.3)]).toEqual(['ArrowRight']);
  });

  it('holds one arrow at a time on a 4-way stick, the stronger axis', () => {
    expect([...stickKeys({ x: 0.3, y: -0.8 }, 'four-way', 0.3)]).toEqual(['ArrowUp']);
    expect([...stickKeys({ x: -0.2, y: 0.6 }, 'four-way', 0.3)]).toEqual(['ArrowDown']);
    expect([...stickKeys({ x: -0.7, y: 0.5 }, 'four-way', 0.3)]).toEqual(['ArrowLeft']);
    expect([...stickKeys({ x: 0.5, y: 0.5 }, 'four-way', 0.3)]).toEqual(['ArrowRight']);
  });
});

describe('shownOffset', () => {
  it('draws a sideways stick on its axis only', () => {
    expect(shownOffset({ x: 0.5, y: 0.5 }, 'left-right')).toEqual({ x: 0.5, y: 0 });
    expect(shownOffset({ x: 0.5, y: 0.5 }, 'four-way')).toEqual({ x: 0.5, y: 0.5 });
  });
});
