import { createFleet } from '@arcade/space-invaders/src/fleet';
import { noControls } from '@arcade/space-invaders/src/controls';
import { updateGame, type GameState } from '@arcade/space-invaders/src/game';
import { alienColor, paletteFor } from '@arcade/space-invaders/src/palette';
import { alienSprites } from '@arcade/space-invaders/src/sprites';
import { alienAt } from '@arcade/space-invaders/src/test-fixtures';
import { describe, expect, it } from 'vitest';
import { findBursts } from './bursts';
import { attractGame, playingGame } from './test-fixtures';

/** The playing data of a game in progress. */
const playingOf = (state: GameState) => {
  if (state.screen === 'attract') throw new Error('not playing');
  return state.playing;
};

/** Number of lit pixels in a sprite. */
const litPixels = (pixels: readonly boolean[]): number => pixels.filter(Boolean).length;

describe('findBursts', () => {
  it('blows up the invader that the shot hits, in its own shape and color', () => {
    const target = alienAt(100, 100, 'crab');
    const prev = playingGame({
      fleet: { ...createFleet(), aliens: [target] },
      shot: { x: 105, y: 104 },
    });
    const next = updateGame(prev, noControls, 1 / 60);
    const { objects } = findBursts(prev, next);
    expect(objects).toHaveLength(1);
    expect(objects[0]).toHaveLength(litPixels(alienSprites.crab[0].pixels));
    expect(objects[0]?.[0]?.color).toBe(alienColor(paletteFor('color'), target.row));
  });

  it('blows up the cannon when it is hit', () => {
    const prev = playingGame();
    const next = playingGame({ cannonExplosion: 90 });
    expect(findBursts(prev, next).objects).toHaveLength(1);
  });

  it('turns the pixels carved out of a shield into debris', () => {
    const prev = playingGame();
    const [first, ...others] = playingOf(prev).shields;
    if (!first) throw new Error('no shield');
    const litIndex = first.bitmap.pixels.indexOf(true);
    const carved = {
      ...first,
      bitmap: {
        ...first.bitmap,
        pixels: first.bitmap.pixels.map((on, index) => on && index !== litIndex),
      },
    };
    const next = playingGame({ shields: [carved, ...others] });
    expect(findBursts(prev, next).debris).toHaveLength(1);
  });

  it('finds nothing when nothing happened', () => {
    const state = playingGame();
    expect(findBursts(state, state)).toEqual({ objects: [], debris: [] });
  });

  it('finds nothing on the attract screen', () => {
    expect(findBursts(attractGame, playingGame())).toEqual({ objects: [], debris: [] });
  });
});
