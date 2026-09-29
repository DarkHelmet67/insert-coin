import { describe, expect, it } from 'vitest';
import { formatScore, isBlinkOn } from './render-hud';
import { tuning } from './tuning.config';

describe('formatScore', () => {
  it('shows three digits, like the original counters', () => {
    expect(formatScore(7)).toBe('007');
    expect(formatScore(448)).toBe('448');
  });

  it('rolls over after 999, as a three-digit counter does', () => {
    expect(formatScore(1004)).toBe('004');
  });
});

describe('isBlinkOn', () => {
  it('blinks about 4 times a second on and off in halves', () => {
    const second = Array.from({ length: tuning.framesPerSecond }, (_, clock) => isBlinkOn(clock));
    const changes = second.filter((on, index) => index > 0 && on !== second[index - 1]).length;
    expect(changes).toBe(7);
    expect(second.filter(Boolean).length).toBeGreaterThanOrEqual(30);
  });
});
