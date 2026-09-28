import { ALIEN_POINTS, createFormation, type Alien } from './aliens';
import { initialCannonState, moveCannon, type CannonState } from './cannon';
import type { Controls } from './controls';
import { explodeAlien, updateExplosions, type Explosion } from './explosions';
import { findHitAlien } from './hits';
import { fireShot, moveShot, type ShotState } from './shot';

/** Everything on screen during a game. */
export interface PlayingState {
  readonly cannon: CannonState;
  /** The cannon's shot, or `undefined` when the cannon is ready to fire. */
  readonly shot: ShotState | undefined;
  readonly aliens: readonly Alien[];
  readonly explosions: readonly Explosion[];
  readonly score: number;
}

/** A new game: cannon on the left, full formation, score zero. */
export const initialPlayingState = (): PlayingState => ({
  cannon: initialCannonState,
  shot: undefined,
  aliens: createFormation(),
  explosions: [],
  score: 0,
});

/** Moves the existing shot, or fires a new one if the player pressed fire and no shot is flying. */
const advanceShot = (
  shot: ShotState | undefined,
  cannon: CannonState,
  fire: boolean,
  dt: number,
): ShotState | undefined => {
  if (shot) return moveShot(shot, dt);
  return fire ? fireShot(cannon) : undefined;
};

/** Removes the hit invader, stops the shot, adds an explosion and the invader's points. */
const destroyAlien = (state: PlayingState, alien: Alien): PlayingState => ({
  ...state,
  shot: undefined,
  aliens: state.aliens.filter((other) => other !== alien),
  explosions: [...state.explosions, explodeAlien(alien)],
  score: state.score + ALIEN_POINTS[alien.kind],
});

/** Brings in a new formation once every invader has been destroyed. */
const nextWaveIfCleared = (state: PlayingState): PlayingState =>
  state.aliens.length === 0 ? { ...state, aliens: createFormation() } : state;

/** Returns the game `dt` seconds later: move the cannon, move or fire the shot, then check for hits. */
export const updatePlaying = (
  state: PlayingState,
  controls: Controls,
  dt: number,
): PlayingState => {
  const cannon = moveCannon(state.cannon, controls.direction, dt);
  const shot = advanceShot(state.shot, cannon, controls.fire, dt);
  const moved = { ...state, cannon, shot, explosions: updateExplosions(state.explosions, dt) };
  const hit = shot && findHitAlien(shot, state.aliens);
  return nextWaveIfCleared(hit ? destroyAlien(moved, hit) : moved);
};
