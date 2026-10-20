// @ts-check
import { describe, expect, it } from 'vitest';
import { bundleProblems, formatKb, isRemaster, reportLine } from './bundles.js';

const budgets = { pong: 10 };

/**
 * A classic game's bundle for tests.
 * @param {Partial<import('./bundles.js').Bundle>} changes
 * @returns {import('./bundles.js').Bundle}
 */
const bundle = (changes = {}) => ({
  name: 'pong',
  remaster: false,
  gzipBytes: 9 * 1024,
  containsThree: false,
  ...changes,
});

describe('isRemaster', () => {
  it('recognises a remaster by its 3D stage', () => {
    expect(isRemaster({ dependencies: { '@arcade/scene3d': 'workspace:*' } })).toBe(true);
    expect(isRemaster({ dependencies: { '@arcade/render': 'workspace:*' } })).toBe(false);
    expect(isRemaster({})).toBe(false);
  });
});

describe('bundleProblems', () => {
  it('accepts a classic game within its budget', () => {
    expect(bundleProblems(bundle(), budgets)).toEqual([]);
  });

  it('rejects a classic game over its budget', () => {
    expect(bundleProblems(bundle({ gzipBytes: 11 * 1024 }), budgets)).toHaveLength(1);
  });

  it('rejects a classic game that contains Three.js', () => {
    expect(bundleProblems(bundle({ containsThree: true }), budgets)[0]).toMatch(/Three\.js/);
  });

  it('asks for a budget for a new classic game', () => {
    expect(bundleProblems(bundle({ name: 'tetris' }), budgets)[0]).toMatch(/no budget/);
  });

  it('lets remasters use Three.js with no budget', () => {
    expect(
      bundleProblems(bundle({ name: 'pong-25d', remaster: true, containsThree: true }), budgets),
    ).toEqual([]);
  });
});

describe('report', () => {
  it('formats sizes in kB', () => {
    expect(formatKb(1536)).toBe('1.5 kB');
    expect(reportLine(bundle(), budgets)).toContain('budget 10 kB');
  });
});
