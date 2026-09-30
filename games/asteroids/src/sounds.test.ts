import { describe, expect, it } from 'vitest';
import { createAttractState, createGameState, type GameState } from './game';
import { seedRandom } from './random';
import { noRocks, type Rock } from './rocks';
import { sounds, soundsFor } from './sounds';
import { newShot } from './shots';
import { newShip } from './ship';

const playing: GameState = {
  ...createGameState(seedRandom(1)),
  delay: 0,
  life: { kind: 'flying' },
  frame: 1,
};
const ROCK: Rock = { kind: 'rock', position: { x: 0, y: 0 }, vx: 8, vy: 8, size: 4, shape: 0 };
const EXPLOSION = { kind: 'explosion', position: { x: 0, y: 0 }, status: 0xa0 } as const;

/** `slots` with `slot` in slot 0. */
const withFirst = <T>(slots: readonly T[], slot: T): readonly T[] =>
  slots.map((old, i) => (i === 0 ? slot : old));

describe('soundsFor', () => {
  it('is silent when nothing happens, and on the attract screen', () => {
    expect(soundsFor(playing, playing)).toEqual([]);
    const attract = createAttractState(seedRandom(1));
    const fired = { ...attract, shots: withFirst(attract.shots, newShot(newShip)) };
    expect(soundsFor(attract, fired)).toEqual([]);
  });

  it('plays the shot of the ship and of the saucer', () => {
    const shot = newShot(newShip);
    expect(soundsFor(playing, { ...playing, shots: withFirst(playing.shots, shot) })).toEqual([
      'fire',
    ]);
    const saucerShot = { ...playing, saucerShots: [shot, null] };
    expect(soundsFor(playing, saucerShot)).toEqual(['saucerFire']);
  });

  it('plays the two notes of the heartbeat', () => {
    const beat = { ...playing, thump: { ...playing.thump, beats: 1, high: false } };
    expect(soundsFor(playing, beat)).toEqual(['thumpLow']);
    const next = { ...beat, thump: { ...beat.thump, beats: 2, high: true } };
    expect(soundsFor(beat, next)).toEqual(['thumpHigh']);
  });

  it('makes large rocks explode deeper than small ones', () => {
    const large = { ...playing, rocks: withFirst(noRocks, ROCK) };
    expect(soundsFor(large, { ...large, rocks: withFirst(noRocks, EXPLOSION) })).toEqual([
      'explosionLow',
    ]);
    const small = { ...playing, rocks: withFirst(noRocks, { ...ROCK, size: 1 as const }) };
    expect(soundsFor(small, { ...small, rocks: withFirst(noRocks, EXPLOSION) })).toEqual([
      'explosionHigh',
    ]);
  });

  it('gives the ship its own explosion only when no rock exploded with it', () => {
    const hit = { ...playing, life: { kind: 'exploding', status: 0xa0, age: 0 } as const };
    expect(soundsFor(playing, hit)).toEqual(['explosionMid']);
    const crash = { ...playing, rocks: withFirst(noRocks, ROCK) };
    expect(soundsFor(crash, { ...hit, rocks: withFirst(noRocks, EXPLOSION) })).toEqual([
      'explosionLow',
    ]);
  });

  it('rumbles while thrusting and warbles while a saucer flies', () => {
    const thrusting = { ...playing, frame: 6, ship: { ...playing.ship, thrusting: true } };
    expect(soundsFor(playing, thrusting)).toContain('thrust');
    const saucer = {
      ...playing,
      frame: 0,
      saucer: { kind: 'saucer', position: { x: 0, y: 0 }, vx: 16, vy: 0, size: 'small' } as const,
    };
    expect(soundsFor(playing, saucer)).toContain('saucerSmall');
  });

  it('beeps for an extra ship', () => {
    expect(soundsFor(playing, { ...playing, lives: 4 })).toEqual(['extraLife']);
  });
});

describe('sounds', () => {
  it('has an effect for every name', () => {
    expect(Object.keys(sounds)).toHaveLength(11);
  });
});
