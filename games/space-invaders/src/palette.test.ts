import { describe, expect, it } from 'vitest';
import { colorAt, colors } from './palette';

describe('colorAt', () => {
  it('follows the cellophane strips of the cabinet', () => {
    expect(colorAt(10)).toBe(colors.text);
    expect(colorAt(40)).toBe(colors.ufo);
    expect(colorAt(120)).toBe(colors.aliens);
    expect(colorAt(200)).toBe(colors.cannon);
  });
});
