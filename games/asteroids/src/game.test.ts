import { describe, expect, it } from 'vitest';
import { noControls, type Controls } from './controls';
import {
  createGameState,
  showsGameOver,
  START_DELAY,
  updateGame,
  WAVE_PAUSE,
  type GameState,
} from './game';
import { killShip } from './player';
import { seedRandom } from './random';
import { rockCount } from './rocks';

const start = createGameState(seedRandom(1979));
/** The game once "PLAYER 1" is over and the ship is flying. */
const flying: GameState = { ...start, delay: 0, life: { kind: 'flying' } };

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
    expect(updateGame(flying, { ...noControls, turn: 1 }).ship.direction).toBe(3);
  });

  it('shows "PLAYER 1" first, then the ship appears', () => {
    expect(run(start, START_DELAY - 1, { ...noControls, turn: 1 }).ship.direction).toBe(0);
    expect(run(start, START_DELAY).life.kind).toBe('hidden');
    expect(run(start, START_DELAY + 1).life.kind).toBe('flying');
  });

  it('jumps into hyperspace while the button is held', () => {
    const jumped = updateGame(flying, { ...noControls, hyperspace: true });
    expect(jumped.life.kind).toBe('hidden');
    expect(jumped.ship.position).not.toEqual(flying.ship.position);
  });

  it('brings the first wave of 4 rocks after the pause', () => {
    expect(rockCount(run(start, WAVE_PAUSE - 1).rocks)).toBe(0);
    const later = run(start, WAVE_PAUSE + 1);
    expect(rockCount(later.rocks)).toBe(4);
    expect(later.waveSize).toBe(4);
  });

  it('fires one shot per press', () => {
    const fired = updateGame(flying, { ...noControls, fire: true });
    expect(fired.shots.filter(Boolean)).toHaveLength(1);
    expect(updateGame(start, { ...noControls, fire: true }).shots.filter(Boolean)).toHaveLength(0);
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

  it('ends the game after the last explosion, keeps the record and restarts with start', () => {
    const lastShip = { ...flying, ...killShip({ ...flying, lives: 1 }), score: 1230, hiScore: 500 };
    expect(showsGameOver(lastShip)).toBe(true);
    const exploding = run(lastShip, 150);
    expect(exploding.phase).toBe('playing');
    const over = run(lastShip, 200);
    expect(over.phase).toBe('over');
    expect(over.hiScore).toBe(1230);
    expect(run(over, 10, { ...noControls, fire: true }).phase).toBe('over');
    const again = updateGame(over, { ...noControls, start: true });
    expect(again).toMatchObject({ phase: 'playing', score: 0, lives: 3, hiScore: 1230 });
    expect(again.delay).toBe(START_DELAY);
  });

  it('keeps a lower record when the game ends', () => {
    const lastShip = { ...flying, ...killShip({ ...flying, lives: 1 }), score: 100, hiScore: 500 };
    expect(run(lastShip, 200).hiScore).toBe(500);
  });

  it('waits for the saucer to go before a new wave or a new ship', () => {
    const saucer = {
      kind: 'saucer',
      position: { x: 100, y: 100 },
      vx: 16,
      vy: 0,
      size: 'large',
    } as const;
    const empty = { ...flying, waveTimer: 0, saucer };
    expect(rockCount(updateGame(empty, noControls).rocks)).toBe(0);
    const respawning = { ...empty, life: { kind: 'hidden', timer: 1, reason: 'respawn' } as const };
    expect(run(respawning, 5).life.kind).toBe('hidden');
    expect(run({ ...respawning, saucer: null }, 1).life.kind).toBe('flying');
  });

  it('sends a saucer when its countdown runs out while the ship flies', () => {
    const due = { ...flying, frame: 4, saucerTimer: 1, rocks: start.rocks };
    expect(updateGame(due, noControls).saucer?.kind).toBe('saucer');
    const shipHidden = { ...due, life: { kind: 'hidden', timer: 40, reason: 'jump' } as const };
    expect(updateGame(shipHidden, noControls).saucer).toBeNull();
  });
});
