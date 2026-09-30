import type { Controls } from './controls';
import { shotsHitRocks } from './hits';
import { nextRandom, type Rng } from './random';
import {
  nextWaveSize,
  noRocks,
  rockCount,
  spawnWave,
  updateRockSlot,
  type RockSlot,
} from './rocks';
import { newShip, updateShip, type Ship } from './ship';
import { fireShot, noShots, updateShot, type ShotSlots } from './shots';

/** Everything that changes during a game. */
export interface GameState {
  /**
   * Frame counter, 0-255 like the program's fast timer [P $5C]: many rules happen "every
   * second frame" or "4 frames on, 4 off" and read its bits.
   */
  readonly frame: number;
  readonly rng: Rng;
  readonly ship: Ship;
  readonly shots: ShotSlots;
  readonly rocks: readonly RockSlot[];
  readonly score: number;
  /** Large rocks in the last wave: the next one has two more, up to 11. */
  readonly waveSize: number;
  /** Frames before the next wave may start, once the screen is clear [P $02FB]. */
  readonly waveTimer: number;
}

/** Frames between the end of a wave and the next one [P $6F87]: about 2 seconds. */
export const WAVE_PAUSE = 0x7f;

/**
 * The state when the page opens: the ship alone, the first wave of 4 rocks coming after the
 * pause. `rng` should differ from game to game: on the cabinet the attract mode kept the
 * generator running, so no two games started alike.
 */
export const createGameState = (rng: Rng): GameState => ({
  frame: 0,
  rng,
  ship: newShip,
  shots: noShots,
  rocks: noRocks,
  score: 0,
  waveSize: 2,
  waveTimer: WAVE_PAUSE,
});

/** A new wave when the pause is over and nothing is left on screen [P $6883, $7168]. */
const startWaveIfDue = (state: GameState): GameState => {
  if (state.waveTimer > 0 || rockCount(state.rocks) > 0) return state;
  const waveSize = nextWaveSize(state.waveSize);
  const { slots, rng } = spawnWave(waveSize, state.rng);
  return { ...state, rocks: slots, rng, waveSize };
};

/** Moves every object; when the last rock explosion ends, the pause before the next wave starts. */
const moveObjects = (state: GameState): GameState => {
  const rocks = state.rocks.map(updateRockSlot);
  const waveEnded = rockCount(state.rocks) > 0 && rockCount(rocks) === 0;
  return {
    ...state,
    shots: state.shots.map((shot) => updateShot(shot, state.frame)),
    rocks,
    waveTimer: waveEnded ? WAVE_PAUSE : state.waveTimer,
  };
};

/**
 * One frame of the game, in the order of the program's main loop [P $6809-$6883]: new wave,
 * fire, ship, moves, collisions, then the generator and the timers.
 */
export const updateGame = (state: GameState, controls: Controls): GameState => {
  const waved = startWaveIfDue(state);
  const fired = controls.fire ? { ...waved, shots: fireShot(waved.shots, waved.ship) } : waved;
  const flown = { ...fired, ship: updateShip(fired.ship, controls, fired.frame) };
  const moved = moveObjects(flown);
  const hit = { ...moved, ...shotsHitRocks(moved) };
  return {
    ...hit,
    frame: (hit.frame + 1) & 0xff,
    rng: nextRandom(hit.rng).rng,
    waveTimer: Math.max(0, hit.waveTimer - 1),
  };
};
