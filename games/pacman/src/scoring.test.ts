import { describe, expect, it } from 'vitest';
import { FRUIT_POSITION, fruitOf } from './fruit';
import { newPlaying } from './playing';
import { POINTS } from './score';
import { addPoints, eatFruit } from './scoring';

describe('scoring', () => {
  it('gives one extra life at 10 000 points', () => {
    const rich = addPoints({ ...newPlaying(0), score: 9990 }, POINTS.dot);
    expect(rich.lives).toBe(4);
    expect(rich.livesShown).toBe(4);
    expect(addPoints({ ...rich, score: 19990 }, POINTS.dot).lives).toBe(4);
  });

  it('eats the fruit on its pixel, shows its points and keeps it counted', () => {
    const start = newPlaying(0);
    const ready = {
      ...start,
      fruit: { kind: fruitOf(0), shown: true },
      pacman: { ...start.pacman, position: FRUIT_POSITION },
    };
    const eaten = eatFruit(ready);
    expect(eaten.score).toBe(100);
    expect(eaten.fruit).toEqual({ kind: fruitOf(0), shown: false });
    expect(eaten.fruitTextTimer).toBeDefined();
    expect(eatFruit(eaten).score).toBe(100);
  });
});
