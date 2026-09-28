import { describe, expect, it } from 'vitest';
import { formatScore } from './score';

describe('formatScore', () => {
  it('pads the score to four digits', () => {
    expect(formatScore(0)).toBe('0000');
    expect(formatScore(120)).toBe('0120');
  });
});
