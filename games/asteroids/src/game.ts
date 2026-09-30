import type { Controls } from './controls';
import { resolveHits } from './hits';
import {
  jumpIntoHyperspace,
  updateExplosion,
  updateHidden,
  waitingToRespawn,
  type PlayerState,
} from './player';
import { nextRandom, type Rng } from './random';
import {
  nextWaveSize,
  noRocks,
  rockCount,
  spawnWave,
  updateRockSlot,
  type RockSlot,
} from './rocks';
import { moveSaucer, noSaucer, WAVE_SAUCER_DELAY, type SaucerState } from './saucer';
import { saucerTurn } from './saucer-turn';
import { newShip, updateShip, type Ship } from './ship';
import { fireShot, noShots, updateShot, type ShotSlots } from './shots';
import { newThump, speedUpThump, THUMP_START_PAUSE, updateThump, type Thump } from './thump';
import { tuning } from './tuning.config';

/** Whether a game is being played, or is over and the rocks drift on their own. */
export type Phase = 'playing' | 'attract';

/** Everything that changes during a game. */
export interface GameState extends PlayerState, SaucerState {
  /**
   * Frame counter, 0-255 like the program's fast timer [P $5C]: many rules happen "every
   * second frame" or "4 frames on, 4 off" and read its bits.
   */
  readonly frame: number;
  readonly rng: Rng;
  readonly shots: ShotSlots;
  readonly rocks: readonly RockSlot[];
  readonly score: number;
  /** The best score of the finished games, saved in the browser by `main.ts`. */
  readonly hiScore: number;
  /** Large rocks in the last wave: the next one has two more, up to 11. */
  readonly waveSize: number;
  /** Frames before the next wave may start, once the screen is clear [P $02FB]. */
  readonly waveTimer: number;
  /** Frames left of "PLAYER 1" at the start, when the controls do nothing yet [P $5A]. */
  readonly delay: number;
  readonly phase: Phase;
  /** The rhythm of the heartbeat, played by the sound. */
  readonly thump: Thump;
}

/** Frames between the end of a wave and the next one [P $6F87]: about 2 seconds. */
export const WAVE_PAUSE = 0x7f;

/** Frames of "PLAYER 1" before the ship appears [P $68F0]: about 2 seconds. */
export const START_DELAY = 0x80;

/**
 * A new game: no rocks yet, the first wave of 4 coming after the pause, the ship waiting for the
 * end of "PLAYER 1". `rng` should differ from game to game: on the cabinet the generator kept
 * running between games, so no two games started alike. The ship keeps the direction of the
 * last game, because the program never resets it.
 */
export const createGameState = (rng: Rng, hiScore = 0, ship: Ship = newShip): GameState => ({
  frame: 0,
  rng,
  ship: { ...newShip, direction: ship.direction },
  life: waitingToRespawn(1),
  lives: tuning.startingLives,
  shots: noShots,
  rocks: noRocks,
  score: 0,
  hiScore,
  waveSize: 2,
  waveTimer: WAVE_PAUSE,
  delay: START_DELAY,
  phase: 'playing',
  ...noSaucer,
  thump: newThump,
});

/**
 * The screen when the page opens, and after every game [P $6885]: the rocks and the saucers go
 * on by themselves, "PUSH START" blinks, and the start button begins a new game.
 */
export const createAttractState = (rng: Rng, hiScore = 0): GameState => ({
  ...createGameState(rng, hiScore),
  phase: 'attract',
  lives: 0,
  delay: 0,
});

/** Most rocks that still let an early saucer in [P $717A]. */
const MAX_SAUCER_ROCK_LIMIT = 10;

/**
 * A new wave when the pause is over and nothing is left on screen, saucer included
 * [P $6883, $7168-$71D7]. Each wave lets the saucers come early with one more rock left, and
 * gives the player a longer pause before the first one.
 */
const startWaveIfDue = (state: GameState): GameState => {
  if (state.waveTimer > 0 || rockCount(state.rocks) > 0 || state.saucer !== null) return state;
  const waveSize = nextWaveSize(state.waveSize);
  const { slots, rng } = spawnWave(waveSize, state.rng);
  return {
    ...state,
    rocks: slots,
    rng,
    waveSize,
    saucerTimer: WAVE_SAUCER_DELAY,
    thump: { ...state.thump, pause: THUMP_START_PAUSE },
    saucerRockLimit: Math.min(MAX_SAUCER_ROCK_LIMIT, state.saucerRockLimit + 1),
  };
};

/** Fire and hyperspace, which work only while the ship is flying [P $6CD7, $6E74]. */
const useButtons = (state: GameState, controls: Controls): GameState => {
  if (state.life.kind !== 'flying') return state;
  const fired = controls.fire ? { ...state, shots: fireShot(state.shots, state.ship) } : state;
  if (!controls.hyperspace) return fired;
  const { player, rng } = jumpIntoHyperspace(fired, fired.rocks, fired.rng);
  return { ...fired, ...player, rng };
};

/** The ship flies with the controls, or a hidden ship waits to come back [P $703F, $6B93]. */
const steerShip = (state: GameState, controls: Controls): GameState =>
  state.life.kind === 'flying'
    ? { ...state, ship: updateShip(state.ship, controls, state.frame) }
    : updateHidden(state, state.rocks, state.saucer);

/** The player's part of a frame: nothing after the game is over. */
const playerTurn = (state: GameState, controls: Controls): GameState =>
  state.phase === 'playing' ? steerShip(useButtons(state, controls), controls) : state;

/** The player and the saucer act only after "PLAYER 1" [P $684E]; the rocks move anyway. */
const actorsTurn = (state: GameState, controls: Controls): GameState =>
  state.delay === 0 ? saucerTurn(playerTurn(state, controls)) : state;

/**
 * Moves every object and runs the explosions [P $6F57]; when the last rock explosion ends, the
 * pause before the next wave starts.
 */
const moveObjects = (state: GameState): GameState => {
  const rocks = state.rocks.map(updateRockSlot);
  const waveEnded = rockCount(state.rocks) > 0 && rockCount(rocks) === 0;
  return {
    ...updateExplosion(moveSaucer(state), state.frame),
    shots: state.shots.map((shot) => updateShot(shot, state.frame)),
    saucerShots: state.saucerShots.map((shot) => updateShot(shot, state.frame)),
    rocks,
    waveTimer: waveEnded ? WAVE_PAUSE : state.waveTimer,
  };
};

/**
 * The game ends when the last ship has finished exploding [P $69A3]: the best score is kept,
 * and the rocks go on drifting.
 */
const endIfNoLives = (state: GameState): GameState =>
  state.phase === 'playing' && state.lives === 0 && state.life.kind === 'hidden'
    ? { ...state, phase: 'attract', hiScore: Math.max(state.hiScore, state.score) }
    : state;

/** Whether the heartbeat plays: rocks on screen and the ship flying or in hyperspace [P $7588]. */
const thumpIsActive = (state: GameState): boolean =>
  rockCount(state.rocks) > 0 &&
  (state.life.kind === 'flying' ||
    (state.life.kind === 'hidden' && state.life.reason !== 'respawn'));

/** One frame of the heartbeat, which gets faster only once the game has really started. */
const beat = (state: GameState): Thump => {
  if (state.phase !== 'playing') return state.thump;
  const thump = state.delay === 0 ? speedUpThump(state.thump, state.frame) : state.thump;
  return updateThump(thump, thumpIsActive(state));
};

/**
 * One frame of the game, in the order of the program's main loop [P $6809-$6883]: new wave,
 * the player's buttons and ship, the saucer, moves, collisions, then the generator and the timers.
 */
export const updateGame = (state: GameState, controls: Controls): GameState => {
  if (state.phase === 'attract' && controls.start) {
    return createGameState(state.rng, state.hiScore, state.ship);
  }
  const moved = moveObjects(actorsTurn(startWaveIfDue(state), controls));
  const hit = endIfNoLives({ ...moved, ...resolveHits(moved) });
  return {
    ...hit,
    thump: beat(hit),
    frame: (hit.frame + 1) & 0xff,
    rng: nextRandom(hit.rng).rng,
    waveTimer: Math.max(0, hit.waveTimer - 1),
    delay: Math.max(0, hit.delay - 1),
  };
};

/**
 * Whether "GAME OVER" is on screen [P $6970]: as soon as the last ship is lost and its shots
 * are gone, while it is still exploding.
 */
export const showsGameOver = (state: GameState): boolean =>
  state.phase === 'playing' && state.lives === 0 && state.shots.every((shot) => shot === null);
