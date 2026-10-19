// @ts-check
import { describe, expect, it } from 'vitest';
import { formatSeconds, formatSummary, projectOf, recordLine } from './build-times.js';

describe('projectOf', () => {
  it('reads the project folder from a pnpm -r line', () => {
    expect(projectOf('games/pacman build: ✓ built in 168ms')).toBe('games/pacman');
  });

  it('ignores color codes', () => {
    expect(projectOf('\u001b[36mgames/breakout\u001b[39m build: Done')).toBe('games/breakout');
  });

  it('returns undefined for lines printed by pnpm itself', () => {
    expect(projectOf('Scope: 6 of 14 workspace projects')).toBeUndefined();
  });
});

describe('recordLine', () => {
  it('keeps the first time and moves the last one', () => {
    const timings = recordLine(recordLine({}, 'games/pacman', 100), 'games/pacman', 350);
    expect(timings).toEqual({ 'games/pacman': { start: 100, end: 350 } });
  });

  it('does not change the previous object', () => {
    const before = recordLine({}, 'games/pacman', 100);
    recordLine(before, 'games/pacman', 350);
    expect(before).toEqual({ 'games/pacman': { start: 100, end: 100 } });
  });
});

describe('formatSummary', () => {
  it('lists each project sorted, their sum and the wall-clock total', () => {
    const timings = {
      'games/pacman': { start: 0, end: 800 },
      'games/breakout': { start: 100, end: 700 },
    };
    expect(formatSummary(timings, 1000)).toBe(
      [
        'Build times',
        '  games/breakout      0.60 s',
        '  games/pacman        0.80 s',
        '  sum of projects     1.40 s',
        '  total (wall clock)  1.00 s',
      ].join('\n'),
    );
  });

  it('formats milliseconds as seconds', () => {
    expect(formatSeconds(2509)).toBe('2.51 s');
  });
});
