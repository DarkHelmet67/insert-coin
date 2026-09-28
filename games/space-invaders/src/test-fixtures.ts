import type { Alien } from './aliens';
import type { AlienKind } from './sprites';

/** An invader for tests, with sensible defaults for the fields a test does not care about. */
export const alienAt = (x: number, y: number, kind: AlienKind = 'octopus', column = 1): Alien => ({
  kind,
  column,
  x,
  y,
  frame: 0,
});

/** `count` invaders parked in the top-left corner, far from anything a test looks at. */
export const bystanders = (count: number): readonly Alien[] =>
  Array.from({ length: count }, (_, index) => alienAt(8 + (index % 4) * 2, 64, 'squid', 1));
