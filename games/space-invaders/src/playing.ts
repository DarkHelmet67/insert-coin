import { initialBombsState, stepBombs, type BombsState } from './bombs';
import {
  CANNON_MIN_X,
  CANNON_WIDTH,
  CANNON_Y,
  initialCannonState,
  moveCannon,
  type CannonState,
} from './cannon';
import {
  awardExtraLife,
  bombsHitCannon,
  bombsHitGround,
  bombsHitShields,
  aliensCrushShields,
  shotHitsAlien,
  shotHitsBomb,
  shotHitsShield,
  shotHitsUfo,
} from './collisions';
import type { Controls } from './controls';
import { stepEffects, type Effect } from './effects';
import { createFleet, fleetBottom, stepFleet, type FleetState } from './fleet';
import { FRAME } from './playfield';
import { createShields, type Shield } from './shields';
import { fireShot, moveShot, type ShotState } from './shot';
import { initialUfoState, stepUfo, type UfoState } from './ufo';

/** Everything on screen during a game. */
export interface PlayingState {
  readonly round: number;
  readonly score: number;
  /** Cannons left, including the one in play. */
  readonly lives: number;
  readonly extraLifeAwarded: boolean;
  /** Shots fired in this game: decides the mystery ship's points and direction. */
  readonly shotsFired: number;
  readonly cannon: CannonState;
  /** Frames left in the cannon's explosion, or `undefined` while it is alive. */
  readonly cannonExplosion: number | undefined;
  /** The cannon's shot, or `undefined` when the cannon is ready to fire. */
  readonly shot: ShotState | undefined;
  readonly fleet: FleetState;
  readonly bombs: BombsState;
  readonly shields: readonly Shield[];
  readonly ufo: UfoState;
  readonly effects: readonly Effect[];
}

/** Cannons at the start of a game. */
export const STARTING_LIVES = 3;

/** A new game: three cannons, the first round's formation, four intact shields. */
export const initialPlayingState = (): PlayingState => ({
  round: 1,
  score: 0,
  lives: STARTING_LIVES,
  extraLifeAwarded: false,
  shotsFired: 0,
  cannon: initialCannonState,
  cannonExplosion: undefined,
  shot: undefined,
  fleet: createFleet(1),
  bombs: initialBombsState,
  shields: createShields(),
  ufo: initialUfoState,
  effects: [],
});

/** Whether the game has ended: no cannons left after the last explosion, or the invaders landed. */
export const isGameOver = (state: PlayingState): boolean =>
  (state.lives === 0 && state.cannonExplosion === undefined) ||
  fleetBottom(state.fleet) >= CANNON_Y;

/** Moves the existing shot, or fires a new one if the player pressed fire and no shot is flying. */
const advanceShot = (state: PlayingState, fire: boolean): PlayingState => {
  if (state.shot) return { ...state, shot: moveShot(state.shot, FRAME) };
  return fire
    ? { ...state, shot: fireShot(state.cannon), shotsFired: state.shotsFired + 1 }
    : state;
};

/** Moves everything that moves by itself: invaders, bombs, the mystery ship and the effects. */
const advanceWorld = (state: PlayingState): PlayingState => ({
  ...state,
  fleet: stepFleet(state.fleet),
  bombs: stepBombs(state.bombs, {
    aliens: state.fleet.aliens,
    cannonCenterX: Math.round(state.cannon.x) + Math.floor(CANNON_WIDTH / 2),
    score: state.score,
  }),
  ufo: stepUfo(state.ufo, state.fleet.aliens.length, state.shotsFired),
  effects: stepEffects(state.effects),
});

/** Starts the next round once every invader is destroyed: lower formation, new shields. */
const nextRoundIfCleared = (state: PlayingState): PlayingState =>
  state.fleet.aliens.length > 0
    ? state
    : {
        ...state,
        round: state.round + 1,
        fleet: createFleet(state.round + 1),
        shields: createShields(),
        bombs: initialBombsState,
        shot: undefined,
      };

/** One frame while the cannon explodes: everything else waits, then a new cannon arrives. */
const stepCannonExplosion = (state: PlayingState, framesLeft: number): PlayingState => {
  if (framesLeft > 1)
    return { ...state, cannonExplosion: framesLeft - 1, effects: stepEffects(state.effects) };
  return {
    ...state,
    cannonExplosion: undefined,
    cannon: { x: CANNON_MIN_X },
    bombs: initialBombsState,
    shot: undefined,
  };
};

/** The collision rules, applied in order after everything has moved. */
const COLLISION_RULES: readonly ((state: PlayingState) => PlayingState)[] = [
  shotHitsAlien,
  shotHitsUfo,
  shotHitsBomb,
  shotHitsShield,
  bombsHitCannon,
  bombsHitShields,
  bombsHitGround,
  aliensCrushShields,
  awardExtraLife,
  nextRoundIfCleared,
];

/**
 * Returns the game one frame later. Like the original, the game logic advances in whole
 * frames (1/60 s): the formation moves one invader per frame and bombs move every 3 frames.
 */
export const updatePlaying = (state: PlayingState, controls: Controls): PlayingState => {
  if (state.cannonExplosion !== undefined) return stepCannonExplosion(state, state.cannonExplosion);
  const moved = advanceWorld(
    advanceShot(
      { ...state, cannon: moveCannon(state.cannon, controls.direction, FRAME) },
      controls.fire,
    ),
  );
  return COLLISION_RULES.reduce((current, rule) => rule(current), moved);
};
