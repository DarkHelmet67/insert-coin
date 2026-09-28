import { describe, expect, it } from 'vitest';
import { createEffect } from './effects';
import type { GameState } from './game';
import { initialPlayingState, type PlayingState } from './playing';
import { soundsFor } from './sounds';

const attract: GameState = { screen: 'attract', attract: { time: 0 }, hiScore: 0 };

/** A playing state with some fields replaced. */
const playing = (changes: Partial<PlayingState> = {}): GameState => ({
  screen: 'playing',
  playing: { ...initialPlayingState(), ...changes },
  hiScore: 0,
});

describe('soundsFor', () => {
  it('plays the coin sound when a game starts', () => {
    expect(soundsFor(attract, playing())).toEqual(['coin']);
  });

  it('plays the shot sound when a shot is fired', () => {
    expect(soundsFor(playing(), playing({ shotsFired: 1 }))).toEqual(['shot']);
  });

  it('plays the hit sounds when an explosion starts', () => {
    expect(soundsFor(playing(), playing({ effects: [createEffect('alien', 0, 0)] }))).toEqual([
      'alienHit',
    ]);
    expect(soundsFor(playing(), playing({ effects: [createEffect('ufo', 0, 0, 50)] }))).toEqual([
      'ufoHit',
    ]);
  });

  it('plays the next march note when the formation starts a new pass', () => {
    const fleet = initialPlayingState().fleet;
    expect(soundsFor(playing(), playing({ fleet: { ...fleet, beat: 1 } }))).toEqual(['march1']);
  });

  it('plays the explosion when the cannon is hit', () => {
    expect(soundsFor(playing(), playing({ cannonExplosion: 90 }))).toEqual(['cannonHit']);
  });

  it('is silent when nothing happens', () => {
    expect(soundsFor(playing(), playing())).toEqual([]);
    expect(soundsFor(attract, attract)).toEqual([]);
  });
});
