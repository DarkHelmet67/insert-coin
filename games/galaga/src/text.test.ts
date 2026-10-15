import { describe, expect, it } from 'vitest';
import { charCode } from './text';

describe('charCode', () => {
  it('maps digits, letters and symbols to the ROM font', () => {
    expect(charCode('0')).toBe(0);
    expect(charCode('9')).toBe(9);
    expect(charCode('A')).toBe(0x0a);
    expect(charCode('Z')).toBe(0x23);
    expect(charCode('-')).toBe(0x26);
    expect(charCode('?')).toBe(0x24);
  });
});
