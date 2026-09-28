import { describe, expect, it } from 'vitest';
import type { GameState } from './game';
import { initialPlayingState, type PlayingState } from './playing';
import { soundsFor } from './sounds';

const attract: GameState = { screen: 'attract', attract: { time: 0 } };

/** A playing state with some fields replaced. */
const playing = (changes: Partial<PlayingState> = {}): GameState => ({
  screen: 'playing',
  playing: { ...initialPlayingState(), ...changes },
});

describe('soundsFor', () => {
  it('plays the coin sound when a game starts', () => {
    expect(soundsFor(attract, playing())).toEqual(['coin']);
  });

  it('plays the shot sound when a shot appears', () => {
    expect(soundsFor(playing(), playing({ shot: { x: 10, y: 200 } }))).toEqual(['shot']);
  });

  it('plays the hit sound when the score goes up', () => {
    const flying = { shot: { x: 10, y: 100 } };
    expect(soundsFor(playing(flying), playing({ score: 10 }))).toEqual(['alienHit']);
  });

  it('is silent when nothing happens', () => {
    expect(soundsFor(playing(), playing())).toEqual([]);
    expect(soundsFor(attract, attract)).toEqual([]);
  });
});
