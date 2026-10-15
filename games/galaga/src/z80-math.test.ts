import { describe, expect, it } from 'vitest';
import { angleTo, divide, multiply, signed8 } from './z80-math';

describe('divide', () => {
  it('divides 16 bits by 8 bits, rounding down', () => {
    expect(divide(0x1000, 0x10)).toBe(0x100);
    expect(divide(100, 7)).toBe(14);
    expect(divide(0xffff, 1)).toBe(0xffff);
  });

  it('gives $FFFF when dividing by zero, as the Z80 routine does', () => {
    expect(divide(1234, 0)).toBe(0xffff);
  });
});

describe('multiply and signed8', () => {
  it('works on bytes', () => {
    expect(multiply(15, 127)).toBe(1905);
    expect(signed8(0xff)).toBe(-1);
    expect(signed8(0x7f)).toBe(127);
    expect(signed8(0x180)).toBe(-128);
  });
});

describe('angleTo', () => {
  // Odd octants come out one step short (up is $FF, not $100): the result is complemented
  // there, exactly as in the original.
  it('points right, up, left and down', () => {
    expect(angleTo(0x40, 0x50, 0x40, 0x40)).toBe(0x000);
    expect(angleTo(0x50, 0x40, 0x40, 0x40)).toBe(0x0ff);
    expect(angleTo(0x40, 0x30, 0x40, 0x40)).toBe(0x1ff);
    expect(angleTo(0x30, 0x40, 0x40, 0x40)).toBe(0x300);
  });

  it('points along the diagonals', () => {
    expect(angleTo(0x50, 0x50, 0x40, 0x40)).toBe(0x080);
    expect(angleTo(0x30, 0x30, 0x40, 0x40)).toBe(0x280);
    expect(angleTo(0x50, 0x30, 0x40, 0x40)).toBe(0x17f);
    expect(angleTo(0x30, 0x50, 0x40, 0x40)).toBe(0x37f);
  });

  it('grows with the slope inside an octant', () => {
    const shallow = angleTo(0x44, 0x50, 0x40, 0x40);
    const steeper = angleTo(0x48, 0x50, 0x40, 0x40);
    expect(shallow).toBeGreaterThan(0);
    expect(steeper).toBeGreaterThan(shallow);
    expect(steeper).toBeLessThan(0x80);
  });
});
