import { describe, expect, it } from 'vitest';
import { seedRandom } from './random';
import {
  countDownToSaucer,
  FIRST_SHOT_DELAY,
  moveSaucer,
  newSaucer,
  noSaucer,
  saucerShoots,
  saucerSize,
  shorterReload,
  SHOT_INTERVAL,
  steerSaucer,
  type Saucer,
  type SaucerState,
} from './saucer';

const SAUCER: Saucer = {
  kind: 'saucer',
  position: { x: 4000, y: 3000 },
  vx: 16,
  vy: 0,
  size: 'small',
};
const flying: SaucerState = { ...noSaucer, saucer: SAUCER, saucerTimer: 1 };

/** Seeds 0..count-1 as generators. */
const seeds = (count: number) => Array.from({ length: count }, (_, seed) => seedRandom(seed * 257));

describe('shorterReload', () => {
  it('makes each saucer come 6 ticks sooner, down to 32', () => {
    expect(shorterReload(0x92)).toBe(0x8c);
    expect(shorterReload(0x26)).toBe(0x20);
    expect(shorterReload(0x24)).toBe(0x24);
  });
});

describe('saucerSize', () => {
  it('is always large for the first saucers, always small from 30,000 points', () => {
    expect(saucerSize(0x80, 50000, seedRandom(1)).size).toBe('large');
    expect(saucerSize(0x7a, 30000, seedRandom(1)).size).toBe('small');
  });

  it('is small more often as the saucers come more often', () => {
    /** How many of 500 saucers are large with this waiting time. */
    const large = (reload: number): number =>
      seeds(500).filter((rng) => saucerSize(reload, 0, rng).size === 'large').length;
    expect(large(0x7a)).toBeGreaterThan(large(0x20));
  });
});

describe('newSaucer', () => {
  it('enters from the left going right, or from the right going left', () => {
    const saucers = seeds(200).map((rng) => newSaucer(0x92, 0, rng).saucer);
    const fromLeft = saucers.filter((saucer) => saucer.vx === 16);
    expect(fromLeft.every((saucer) => saucer.position.x === 0)).toBe(true);
    const fromRight = saucers.filter((saucer) => saucer.vx === -16);
    expect(fromRight.every((saucer) => saucer.position.x === 8191)).toBe(true);
    expect(fromLeft.length).toBeGreaterThan(0);
    expect(fromRight.length).toBeGreaterThan(0);
    expect(saucers.every((saucer) => saucer.position.y < 6144 && saucer.vy === 0)).toBe(true);
  });
});

describe('countDownToSaucer', () => {
  it('counts down, then sends a saucer that shoots 18 ticks later', () => {
    const counting = countDownToSaucer({ ...noSaucer, saucerTimer: 5 }, 4, 0, seedRandom(1));
    expect(counting.state).toMatchObject({ saucer: null, saucerTimer: 4 });
    const arrived = countDownToSaucer({ ...noSaucer, saucerTimer: 1 }, 4, 0, seedRandom(1));
    expect(arrived.state.saucer?.kind).toBe('saucer');
    expect(arrived.state).toMatchObject({ saucerTimer: FIRST_SHOT_DELAY, saucerReload: 0x8c });
  });

  it('after a recent hit on a rock, waits until few rocks are left', () => {
    const polite = { ...noSaucer, saucerTimer: 1, rockHitTimer: 40, saucerRockLimit: 6 };
    expect(countDownToSaucer(polite, 6, 0, seedRandom(1)).state.saucer).toBeNull();
    expect(countDownToSaucer(polite, 0, 0, seedRandom(1)).state.saucer).toBeNull();
    expect(countDownToSaucer(polite, 5, 0, seedRandom(1)).state.saucer).not.toBeNull();
  });

  it('comes anyway to a player who stopped shooting rocks', () => {
    const lurking = { ...noSaucer, saucerTimer: 1, rockHitTimer: 0, saucerRockLimit: 6 };
    expect(countDownToSaucer(lurking, 11, 0, seedRandom(1)).state.saucer).not.toBeNull();
  });
});

describe('steerSaucer', () => {
  it('picks a new vertical speed: up, down or straight', () => {
    const speeds = new Set(seeds(100).map((rng) => steerSaucer(SAUCER, rng).saucer.vy));
    expect([...speeds].sort((a, b) => a - b)).toEqual([-16, 0, 16]);
  });
});

describe('moveSaucer', () => {
  it('moves, and leaves at the other side, restarting the countdown', () => {
    expect(moveSaucer(flying).saucer).toMatchObject({ position: { x: 4016, y: 3000 } });
    const atEdge = { ...flying, saucer: { ...SAUCER, position: { x: 8180, y: 3000 } } };
    expect(moveSaucer(atEdge)).toMatchObject({ saucer: null, saucerTimer: 0x92 });
  });

  it('wraps up and down', () => {
    const top = { ...flying, saucer: { ...SAUCER, position: { x: 4000, y: 6140 }, vy: 16 } };
    expect(moveSaucer(top).saucer?.position.y).toBe(12);
  });
});

describe('saucerShoots', () => {
  it('shoots when the timer runs out, then every 10 ticks', () => {
    const shot = saucerShoots(flying, { x: 6000, y: 3000 }, 0, seedRandom(3));
    expect(shot.state.saucerShots.filter(Boolean)).toHaveLength(1);
    expect(shot.state.saucerTimer).toBe(SHOT_INTERVAL);
    const waiting = saucerShoots({ ...flying, saucerTimer: 5 }, { x: 0, y: 0 }, 0, seedRandom(3));
    expect(waiting.state.saucerShots.filter(Boolean)).toHaveLength(0);
  });

  it('aims the small saucer at the ship, within its error', () => {
    const shot = saucerShoots(flying, { x: 6000, y: 3000 }, 0, seedRandom(3)).state.saucerShots[1];
    // The ship is to the right: the shot flies right, a little up or down at most.
    expect(shot?.vx).toBeGreaterThan(Math.abs(shot?.vy ?? 0));
  });
});
