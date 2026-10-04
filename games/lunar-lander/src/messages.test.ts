import { describe, expect, it } from 'vitest';
import { attractLines, fuelLostLines, outcomeLines, readyLines } from './messages';

describe('messages', () => {
  it('writes a title only for landings, not for crashes', () => {
    expect(outcomeLines('good', 0, 50).length).toBeGreaterThan(outcomeLines('crash', 0, 5).length);
  });

  it('centres each verdict with its own nudge', () => {
    const first = outcomeLines('crash', 0, 5);
    expect(Math.min(...first.map((line) => line.x1))).toBeGreaterThan(272 + 180);
  });

  it('flashes INSERT COINS in attract', () => {
    expect(attractLines(750, true).length).toBeGreaterThan(attractLines(750, false).length);
  });

  it('writes the fuel on the ready screen and the fuel lost', () => {
    expect(readyLines(750).length).toBeGreaterThan(0);
    expect(fuelLostLines(140).length).toBeGreaterThan(0);
  });
});
