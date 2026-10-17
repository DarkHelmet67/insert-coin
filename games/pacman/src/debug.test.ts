import { describe, expect, it } from 'vitest';
import { passesThrough } from './core';
import { debug, DEBUG_OFF } from './debug';
import { intermissionAfter } from './level-flow';
import { levelSettings } from './levels';
import { newPlaying, roundOf, withGhost } from './playing';
import { gameStartVideo } from './screen';
import { tuning } from './tuning.config';

describe('debug mode', () => {
  it('is off in the published game', () => {
    expect(tuning.debug.enabled).toBe(false);
    expect(debug).toEqual(DEBUG_OFF);
  });

  it('starts from the chosen level, with its settings and its fruits', () => {
    const fifth = newPlaying(0, 5);
    expect(fifth.level).toBe(5);
    expect(fifth.settings).toEqual(levelSettings(5));
    expect(fifth.video).toEqual(gameStartVideo(0, tuning.lives, roundOf({ level: 5 })));
    expect(newPlaying(0, 1).video).toEqual(gameStartVideo(0, tuning.lives));
  });

  it('in god mode a ghost that is not blue passes through Pac-Man, but not in the demo', () => {
    const game = newPlaying(0, 1);
    expect(passesThrough(game, 0, false)).toBe(false);
    expect(passesThrough(game, 0, true)).toBe(true);
    expect(passesThrough({ ...game, demo: true }, 0, true)).toBe(false);
    const blinky = game.ghosts[0];
    if (!blinky) throw new Error('Blinky is missing');
    expect(passesThrough(withGhost(game, { ...blinky, blue: true }), 0, true)).toBe(false);
  });

  it('can skip the intermissions', () => {
    // The first intermission comes after level 2 (round 1).
    expect(intermissionAfter(1, false)).toBeDefined();
    expect(intermissionAfter(1, true)).toBeUndefined();
  });
});
