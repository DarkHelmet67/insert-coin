import { describe, expect, it } from 'vitest';
import { createEffect } from '@arcade/space-invaders/src/effects';
import { drawableState, isHudRect, splitScreen } from './screen';
import { attractGame, playingGame } from './test-fixtures';

/** A one-pixel rectangle at row `y`. */
const rect = (y: number, height = 1) => ({ x: 0, y, width: 1, height, color: '#fff' });

describe('drawableState', () => {
  it('leaves out the 2D bursts of the invaders, replaced by flying voxels', () => {
    const state = drawableState(
      playingGame({ effects: [createEffect('alien', 10, 10), createEffect('shot', 20, 20)] }),
    );
    expect(state.screen !== 'attract' && state.playing.effects.map((e) => e.kind)).toEqual([
      'shot',
    ]);
  });

  it('leaves the attract screen as it is', () => {
    expect(drawableState(attractGame)).toBe(attractGame);
  });
});

describe('isHudRect', () => {
  it('keeps the score header and the reserve cannons flat', () => {
    expect(isHudRect(rect(8))).toBe(true);
    expect(isHudRect(rect(243))).toBe(true);
  });

  it('puts the playfield and the ground line in 3D', () => {
    expect(isHudRect(rect(40))).toBe(false);
    expect(isHudRect(rect(239))).toBe(false);
    // The last line of the attract screen ends just below the ground: it stays in 3D.
    expect(isHudRect(rect(240))).toBe(false);
  });
});

describe('splitScreen', () => {
  it('splits the drawing between the score bars and the playfield', () => {
    const { hud, field } = splitScreen([rect(8), rect(100)]);
    expect(hud).toEqual([rect(8)]);
    expect(field).toEqual([rect(100)]);
  });
});
