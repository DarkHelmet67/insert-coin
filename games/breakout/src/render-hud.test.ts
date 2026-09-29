import { describe, expect, it } from 'vitest';
import { formatScore } from './render-hud';

describe('formatScore', () => {
  it('shows three digits, like the original counters', () => {
    expect(formatScore(7)).toBe('007');
    expect(formatScore(448)).toBe('448');
  });

  it('rolls over after 999, as a three-digit counter does', () => {
    expect(formatScore(1004)).toBe('004');
  });
});
