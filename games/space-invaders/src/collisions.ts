import { bitmapsOverlap, type PlacedBitmap } from '@arcade/collision';
import { ALIEN_POINTS, type Alien } from './aliens';
import { removeBombs, type Bomb } from './bombs';
import { CANNON_EXPLOSION_FRAMES, CANNON_Y } from './cannon';
import { createEffect, explodeAlien } from './effects';
import { removeAlien } from './fleet';
import { GROUND_Y } from './playfield';
import type { PlayingState } from './playing';
import { damageShields, findHitShield } from './shields';
import type { ShotState } from './shot';
import {
  alienSprites,
  bombExplosionSprite,
  bombSprites,
  cannonSprite,
  shotExplosionSprite,
  shotSprite,
  ufoSprite,
} from './sprites';
import { UFO_Y, ufoScore } from './ufo';

// Every rule takes the state after movement and returns it with one kind of collision resolved.

/** Score that earns an extra cannon, once per game. */
export const EXTRA_LIFE_SCORE = 1500;

/** The shot as a placed bitmap, for pixel-perfect tests. */
const placedShot = (shot: ShotState): PlacedBitmap => ({
  bitmap: shotSprite,
  x: shot.x,
  y: shot.y,
});

/** An invader as a placed bitmap, in its current animation frame. */
const placedAlien = (alien: Alien): PlacedBitmap => ({
  bitmap: alienSprites[alien.kind][alien.frame],
  x: alien.x,
  y: alien.y,
});

/** A bomb as a placed bitmap, in its current animation frame. */
const placedBomb = (bomb: Bomb): PlacedBitmap => ({
  bitmap: bombSprites[bomb.kind][bomb.steps % 4] ?? bombSprites[bomb.kind][0],
  x: bomb.x,
  y: bomb.y,
});

/** The splash that the cannon's shot carves in a shield, centered on its tip. */
const shotSplash = (shot: ShotState): PlacedBitmap => ({
  bitmap: shotExplosionSprite,
  x: shot.x - 3,
  y: shot.y - 2,
});

/** The splash that a bomb carves in a shield, around its lower end. */
const bombSplash = (bomb: Bomb): PlacedBitmap => ({
  bitmap: bombExplosionSprite,
  x: bomb.x - 1,
  y: bomb.y + 2,
});

/** Shot hits invader: the invader explodes and its points are scored. */
export const shotHitsAlien = (state: PlayingState): PlayingState => {
  const { shot } = state;
  const alien =
    shot && state.fleet.aliens.find((a) => bitmapsOverlap(placedShot(shot), placedAlien(a)));
  if (!alien) return state;
  return {
    ...state,
    shot: undefined,
    fleet: removeAlien(state.fleet, alien),
    effects: [...state.effects, explodeAlien(alien)],
    score: state.score + ALIEN_POINTS[alien.kind],
  };
};

/** Shot hits the mystery ship: its points depend on how many shots have been fired. */
export const shotHitsUfo = (state: PlayingState): PlayingState => {
  const { shot } = state;
  const saucer = state.ufo.saucer;
  if (
    !shot ||
    !saucer ||
    !bitmapsOverlap(placedShot(shot), { bitmap: ufoSprite, x: saucer.x, y: UFO_Y })
  ) {
    return state;
  }
  const points = ufoScore(state.shotsFired);
  return {
    ...state,
    shot: undefined,
    ufo: { ...state.ufo, saucer: undefined },
    effects: [...state.effects, createEffect('ufo', saucer.x, UFO_Y, points)],
    score: state.score + points,
  };
};

/** Shot meets a bomb: both are destroyed. */
export const shotHitsBomb = (state: PlayingState): PlayingState => {
  const { shot } = state;
  const bomb =
    shot && state.bombs.active.find((b) => bitmapsOverlap(placedShot(shot), placedBomb(b)));
  if (!shot || !bomb) return state;
  return {
    ...state,
    shot: undefined,
    bombs: removeBombs(state.bombs, [bomb]),
    effects: [...state.effects, createEffect('shot', shot.x - 3, shot.y - 2)],
  };
};

/** Shot hits a shield: the shot stops and carves a hole. */
export const shotHitsShield = (state: PlayingState): PlayingState => {
  const { shot } = state;
  if (!shot || !findHitShield(state.shields, placedShot(shot))) return state;
  return { ...state, shot: undefined, shields: damageShields(state.shields, shotSplash(shot)) };
};

/** A bomb hits the cannon: one life lost, and the game pauses while the cannon explodes. */
export const bombsHitCannon = (state: PlayingState): PlayingState => {
  const cannon = { bitmap: cannonSprite, x: state.cannon.x, y: CANNON_Y };
  const bomb = state.bombs.active.find((b) => bitmapsOverlap(placedBomb(b), cannon));
  if (!bomb) return state;
  return {
    ...state,
    lives: state.lives - 1,
    cannonExplosion: CANNON_EXPLOSION_FRAMES,
    bombs: removeBombs(state.bombs, [bomb]),
  };
};

/** Bombs hit the shields: each bomb stops and carves a hole. */
export const bombsHitShields = (state: PlayingState): PlayingState => {
  const hits = state.bombs.active.filter((bomb) => findHitShield(state.shields, placedBomb(bomb)));
  if (hits.length === 0) return state;
  return {
    ...state,
    bombs: removeBombs(state.bombs, hits),
    shields: hits.reduce(
      (shields, bomb) => damageShields(shields, bombSplash(bomb)),
      state.shields,
    ),
  };
};

/** Bombs reach the ground and explode there. */
export const bombsHitGround = (state: PlayingState): PlayingState => {
  const landed = state.bombs.active.filter((bomb) => bomb.y + 8 >= GROUND_Y);
  if (landed.length === 0) return state;
  return {
    ...state,
    bombs: removeBombs(state.bombs, landed),
    effects: [
      ...state.effects,
      ...landed.map((bomb) => createEffect('bomb', bomb.x - 1, GROUND_Y - 8)),
    ],
  };
};

/** Invaders marching over the shields erase the parts they cover. */
export const aliensCrushShields = (state: PlayingState): PlayingState => ({
  ...state,
  shields: state.fleet.aliens.reduce(
    (shields, alien) => damageShields(shields, placedAlien(alien)),
    state.shields,
  ),
});

/** One extra cannon when the score first reaches 1500. */
export const awardExtraLife = (state: PlayingState): PlayingState =>
  !state.extraLifeAwarded && state.score >= EXTRA_LIFE_SCORE
    ? { ...state, lives: state.lives + 1, extraLifeAwarded: true }
    : state;
