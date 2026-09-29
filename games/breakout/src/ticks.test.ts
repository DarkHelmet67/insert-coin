import { describe, expect, it } from 'vitest';
import { noTicks, updateTicks, type Ticks } from './ticks';
import { tuning } from './tuning.config';

/** Runs `frames` frames with no new points after the first. */
const run = (start: Ticks, points: number, frames: number): Ticks =>
  Array.from({ length: frames - 1 }).reduce<Ticks>(
    (ticks) => updateTicks(ticks, 0),
    updateTicks(start, points),
  );

describe('updateTicks', () => {
  it('stays silent with no points', () => {
    expect(updateTicks(noTicks, 0)).toBe(noTicks);
  });

  it('plays one tick at once and the rest spaced out', () => {
    const first = updateTicks(noTicks, 3);
    expect(first).toMatchObject({ owed: 2, played: 1 });
    expect(run(noTicks, 3, tuning.sounds.tickFrames)).toMatchObject({ played: 1 });
    expect(run(noTicks, 3, tuning.sounds.tickFrames + 1)).toMatchObject({ played: 2 });
  });

  it('pays out every point, one tick each', () => {
    expect(run(noTicks, 7, 7 * tuning.sounds.tickFrames)).toMatchObject({ owed: 0, played: 7 });
  });

  it('adds points scored while ticking', () => {
    const busy = updateTicks(updateTicks(noTicks, 1), 5);
    expect(busy).toMatchObject({ owed: 5, played: 1 });
  });
});
