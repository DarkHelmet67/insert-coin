import { describe, expect, it } from 'vitest';
import { badgeColumns, stageFlags } from './badges';

describe('stage badges', () => {
  it('counts stages with flags of 50, 30, 20, 10, 5 and 1', () => {
    expect(stageFlags(1).map((f) => f.first)).toEqual([0x36]);
    expect(stageFlags(7).map((f) => f.first)).toEqual([0x38, 0x36, 0x36]);
    expect(stageFlags(48).map((f) => f.first)).toEqual([0x42, 0x3a, 0x38, 0x36, 0x36, 0x36]);
    expect(stageFlags(100).map((f) => f.first)).toEqual([0x46, 0x46]);
  });

  it('draws 1, 5 and 50 in palette 1, the others in palette 2', () => {
    expect(badgeColumns(15, 2).map((c) => c.palette)).toEqual([2, 2, 1]);
  });
});
