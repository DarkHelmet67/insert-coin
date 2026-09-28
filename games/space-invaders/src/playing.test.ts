import { describe, expect, it } from 'vitest';
import type { Alien } from './aliens';
import { CANNON_EXPLOSION_FRAMES, CANNON_MIN_X, CANNON_Y } from './cannon';
import { noControls, type Controls } from './controls';
import { createFleet } from './fleet';
import { initialPlayingState, isGameOver, updatePlaying, type PlayingState } from './playing';
import { alienAt, bystanders } from './test-fixtures';

const fire = { ...noControls, fire: true };

/**
 * A game with the cannon at `x` = 100 and the given invaders. A rolling bomb is already falling
 * far to the left: it keeps the invaders from dropping new bombs that would stop our shot.
 */
const gameWith = (aliens: readonly Alien[], direction: 1 | -1 = 1): PlayingState => ({
  ...initialPlayingState(),
  cannon: { x: 100 },
  fleet: { ...createFleet(), aliens, direction },
  bombs: { ...initialPlayingState().bombs, active: [{ kind: 'rolling', x: 2, y: 60, steps: 0 }] },
});

/** Runs `frames` updates with the same controls. */
const run = (state: PlayingState, frames: number, controls: Controls = noControls): PlayingState =>
  Array.from({ length: frames }).reduce<PlayingState>((s) => updatePlaying(s, controls), state);

describe('updatePlaying', () => {
  it('fires a shot and counts it', () => {
    expect(updatePlaying(initialPlayingState(), fire)).toMatchObject({ shotsFired: 1 });
    expect(updatePlaying(initialPlayingState(), fire).shot).toBeDefined();
  });

  it('allows only one shot at a time', () => {
    const firing = updatePlaying(initialPlayingState(), fire);
    const again = updatePlaying(firing, fire);
    expect(again.shotsFired).toBe(1);
    expect(again.shot?.y).toBeLessThan(firing.shot?.y ?? 0);
  });

  it('destroys an invader in the line of fire and scores its points', () => {
    // The shot leaves x = 106. The target is last in marching order, so it stays still
    // while the bystanders in the corner take their turn.
    const target = alienAt(100, 170, 'octopus', 5);
    const hit = run(gameWith([...bystanders(20), target]), 12, fire);
    expect(hit.fleet.aliens).toHaveLength(20);
    expect(hit.score).toBe(10);
  });

  it('brings a lower formation when the last invader is destroyed', () => {
    // A lone invader moves every frame: marching left from x = 110, it crosses the shot's path.
    const cleared = run(gameWith([alienAt(110, 190, 'octopus', 5)], -1), 6, fire);
    expect(cleared).toMatchObject({ round: 2, score: 10 });
    expect(cleared.fleet.aliens).toHaveLength(55);
  });

  it('freezes the game while the cannon explodes, then brings a new cannon', () => {
    const exploding = { ...initialPlayingState(), cannon: { x: 150 }, cannonExplosion: 2 };
    expect(updatePlaying(exploding, fire)).toMatchObject({ cannonExplosion: 1, shot: undefined });
    expect(run(exploding, 2)).toMatchObject({
      cannonExplosion: undefined,
      cannon: { x: CANNON_MIN_X },
    });
  });
});

describe('isGameOver', () => {
  it('is over once the last cannon has finished exploding', () => {
    const lastCannon = {
      ...initialPlayingState(),
      lives: 0,
      cannonExplosion: CANNON_EXPLOSION_FRAMES,
    };
    expect(isGameOver(lastCannon)).toBe(false);
    expect(isGameOver({ ...lastCannon, cannonExplosion: undefined })).toBe(true);
  });

  it('is over when the invaders reach the cannon', () => {
    expect(isGameOver(gameWith([alienAt(50, CANNON_Y - 8)]))).toBe(true);
    expect(isGameOver(initialPlayingState())).toBe(false);
  });
});
