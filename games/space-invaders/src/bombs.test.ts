import { describe, expect, it } from 'vitest';
import {
  bombSpeed,
  columnAbove,
  initialBombsState,
  lowestInColumn,
  reloadSteps,
  stepBombs,
  type BombContext,
  type BombsState,
} from './bombs';
import { alienAt } from './test-fixtures';

const aliens = [
  alienAt(100, 80, 'octopus', 5),
  alienAt(100, 100, 'octopus', 5),
  alienAt(40, 100, 'octopus', 1),
];
const context: BombContext = { aliens, cannonCenterX: 106, score: 0 };

/** Runs `frames` steps of the bombs with the same context. */
const run = (state: BombsState, frames: number, ctx = context): BombsState =>
  Array.from({ length: frames }).reduce<BombsState>((s) => stepBombs(s, ctx), state);

describe('bomb rules', () => {
  it('reloads faster as the score grows', () => {
    expect([0, 200, 1000, 2000, 3000].map(reloadSteps)).toEqual([48, 16, 11, 8, 7]);
  });

  it('falls faster when 8 invaders or fewer are left', () => {
    expect([bombSpeed(9), bombSpeed(8)]).toEqual([4, 5]);
  });

  it('finds the invader that drops the bombs of a column', () => {
    expect(lowestInColumn(aliens, 5)?.y).toBe(100);
    expect(lowestInColumn(aliens, 3)).toBeUndefined();
  });

  it('finds the column above the cannon', () => {
    expect(columnAbove(aliens, 106)).toBe(5);
    expect(columnAbove(aliens, 70)).toBeUndefined();
  });
});

describe('stepBombs', () => {
  it('drops the rolling bomb from the lowest invader above the cannon', () => {
    expect(stepBombs(initialBombsState, context).active).toEqual([
      { kind: 'rolling', x: 105, y: 108, steps: 0 },
    ]);
  });

  it('moves each bomb once every 3 frames', () => {
    const dropped = stepBombs(initialBombsState, context);
    expect(run(dropped, 3).active[0]).toMatchObject({ y: 113, steps: 1 }); // 5 px: only 3 invaders left;
  });

  it('waits for the falling bombs to cover the reload distance before dropping another', () => {
    // At 3000 points and more a bomb must take 7 steps (21 frames) before the next one drops.
    const expert = { ...context, score: 5000 };
    const dropped = stepBombs(initialBombsState, expert);
    expect(run(dropped, 21, expert).active).toHaveLength(1);
    expect(run(dropped, 22, expert).active.map((b) => b.kind)).toEqual(['rolling', 'plunger']);
  });

  it('never drops a plunger bomb when only one invader is left', () => {
    const alone = { ...context, aliens: [alienAt(40, 100, 'octopus', 1)], cannonCenterX: 0 };
    expect(run(initialBombsState, 3, alone).active.map((b) => b.kind)).not.toContain('plunger');
  });
});
