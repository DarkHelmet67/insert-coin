import { describe, expect, it } from 'vitest';
import { shotsHitRocks, type HitState } from './hits';
import { seedRandom } from './random';
import { noRocks, type Rock } from './rocks';
import { noShots, type Shot } from './shots';

const ROCK: Rock = {
  kind: 'rock',
  position: { x: 4000, y: 3000 },
  vx: 10,
  vy: 10,
  size: 4,
  shape: 0,
};
const SHOT: Shot = { position: { x: 4100, y: 3000 }, vx: 60, vy: 0, life: 10 };

const state: HitState = {
  shots: noShots.map((shot, i) => (i === 3 ? SHOT : shot)),
  rocks: noRocks.map((slot, i) => (i === 26 ? ROCK : slot)),
  score: 0,
  rng: seedRandom(9),
};

describe('shotsHitRocks', () => {
  it('breaks the rock, removes the shot and scores', () => {
    const next = shotsHitRocks(state);
    expect(next.shots).toEqual(noShots);
    expect(next.rocks[26]?.kind).toBe('explosion');
    expect(next.rocks.filter((slot) => slot?.kind === 'rock')).toHaveLength(2);
    expect(next.score).toBe(20);
  });

  it('lets a shot fly on when it misses', () => {
    const far = {
      ...state,
      shots: state.shots.map((shot) => shot && { ...shot, position: { x: 100, y: 100 } }),
    };
    expect(shotsHitRocks(far)).toEqual(far);
  });

  it('lets a second shot in the same spot hit a child rock, not the explosion', () => {
    const twoShots = { ...state, shots: [null, null, SHOT, SHOT] };
    const next = shotsHitRocks(twoShots);
    expect(next.shots.filter(Boolean)).toHaveLength(0);
    expect(next.score).toBe(20 + 50);
  });
});
