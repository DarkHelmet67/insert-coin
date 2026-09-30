import { describe, expect, it } from 'vitest';
import { FIELD_HEIGHT, FIELD_WIDTH, movePoint, toScreen, wrap } from './position';

describe('wrap', () => {
  it('brings values back from both sides', () => {
    expect(wrap(8200, FIELD_WIDTH)).toBe(8);
    expect(wrap(-8, FIELD_WIDTH)).toBe(8184);
    expect(wrap(100, FIELD_WIDTH)).toBe(100);
  });
});

describe('movePoint', () => {
  it('leaves at the top and comes back at the bottom', () => {
    expect(movePoint({ x: 10, y: FIELD_HEIGHT - 2 }, 0, 5)).toEqual({ x: 10, y: 3 });
  });

  it('leaves on the left and comes back on the right', () => {
    expect(movePoint({ x: 3, y: 10 }, -5, 0)).toEqual({ x: FIELD_WIDTH - 2, y: 10 });
  });
});

describe('toScreen', () => {
  it('maps the playfield onto the visible vector screen', () => {
    expect(toScreen({ x: 0, y: 0 })).toEqual({ x: 0, y: 128 });
    expect(toScreen({ x: FIELD_WIDTH - 1, y: FIELD_HEIGHT - 1 })).toEqual({ x: 1023, y: 895 });
  });
});
