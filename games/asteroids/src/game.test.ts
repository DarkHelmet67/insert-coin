import { describe, expect, it } from 'vitest';
import { noControls, type Controls } from './controls';
import { createGameState, updateGame, WAVE_PAUSE, type GameState } from './game';
import { seedRandom } from './random';
import { rockCount } from './rocks';

const start = createGameState(seedRandom(1979));

/** Runs `frames` frames with the same controls. */
const run = (state: GameState, frames: number, controls: Controls = noControls): GameState =>
  Array.from({ length: frames }).reduce<GameState>(
    (current) => updateGame(current, controls),
    state,
  );

describe('updateGame', () => {
  it('counts frames from 0 to 255 and starts again', () => {
    expect(updateGame(start, noControls).frame).toBe(1);
    expect(updateGame({ ...start, frame: 255 }, noControls).frame).toBe(0);
  });

  it('turns the ship with the controls', () => {
    expect(updateGame(start, { ...noControls, turn: 1 }).ship.direction).toBe(3);
  });

  it('brings the first wave of 4 rocks after the pause', () => {
    expect(rockCount(run(start, WAVE_PAUSE - 1).rocks)).toBe(0);
    const later = run(start, WAVE_PAUSE + 1);
    expect(rockCount(later.rocks)).toBe(4);
    expect(later.waveSize).toBe(4);
  });

  it('fires one shot per press', () => {
    const fired = updateGame(start, { ...noControls, fire: true });
    expect(fired.shots.filter(Boolean)).toHaveLength(1);
  });

  it('starts the pause when the last explosion ends, then a bigger wave', () => {
    const lastExplosion = {
      ...start,
      waveSize: 4,
      waveTimer: 0,
      rocks: start.rocks.map((slot, i) =>
        i === 0 ? { kind: 'explosion' as const, position: { x: 0, y: 0 }, status: 0xff } : slot,
      ),
    };
    const cleared = updateGame(lastExplosion, noControls);
    expect(rockCount(cleared.rocks)).toBe(0);
    expect(cleared.waveTimer).toBe(WAVE_PAUSE - 1);
    expect(rockCount(run(cleared, WAVE_PAUSE).rocks)).toBe(6);
  });
});
