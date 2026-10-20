import type { Fragment } from '@arcade/particles';
import type { Alien } from '@arcade/space-invaders/src/aliens';
import { CANNON_Y } from '@arcade/space-invaders/src/cannon';
import { EFFECT_FRAMES, explodeAlien, type Effect } from '@arcade/space-invaders/src/effects';
import type { GameState } from '@arcade/space-invaders/src/game';
import { alienColor, paletteFor, type Palette } from '@arcade/space-invaders/src/palette';
import type { PlayingState } from '@arcade/space-invaders/src/playing';
import type { Shield } from '@arcade/space-invaders/src/shields';
import { alienSprites, cannonSprite, ufoSprite } from '@arcade/space-invaders/src/sprites';
import { UFO_Y } from '@arcade/space-invaders/src/ufo';
import { spriteVoxels } from '@arcade/voxel';

/**
 * What blew up between two states of the game, as groups of fragments ready for
 * `createBurst`. Like the sounds of the original (sounds.ts), explosions are found by comparing
 * the state before and after a step: the game logic does not know they exist.
 */
export interface Bursts {
  /** Invaders, the mystery ship and the cannon: each one a group of voxels. */
  readonly objects: readonly (readonly Fragment[])[];
  /** Pixels carved out of the shields, as small debris. */
  readonly debris: readonly Fragment[];
}

/** No explosion. */
const NO_BURSTS: Bursts = { objects: [], debris: [] };

/** The playing data of a state that has it: during play and on the game over screen. */
const playingOf = (state: GameState): PlayingState | undefined =>
  state.screen === 'attract' ? undefined : state.playing;

/** The effects of `kind` that appeared in this step. */
const startedEffects = (state: PlayingState, kind: Effect['kind']): readonly Effect[] =>
  state.effects.filter(
    (effect) => effect.kind === kind && effect.framesLeft === EFFECT_FRAMES[kind],
  );

/** How far the burst `effect` is from the one `alien` would leave if it were hit. */
const distanceToBurst = (alien: Alien, effect: Effect): number => {
  const expected = explodeAlien(alien);
  return Math.hypot(expected.x - effect.x, expected.y - effect.y);
};

/**
 * The invader that was hit where `effect` appeared: the one, before the step, whose burst
 * would be right there. Matching by position also works when the last invader of a round is
 * hit and a whole new formation replaces the old one in the same step.
 */
const hitAlien = (prev: PlayingState, effect: Effect): Alien | undefined =>
  prev.fleet.aliens.reduce<Alien | undefined>(
    (closest, alien) =>
      closest === undefined || distanceToBurst(alien, effect) < distanceToBurst(closest, effect)
        ? alien
        : closest,
    undefined,
  );

/** The voxels of an invader, in its color. */
const alienFragments = (alien: Alien, palette: Palette): readonly Fragment[] =>
  spriteVoxels(
    alienSprites[alien.kind][alien.frame],
    alien.x,
    alien.y,
    alienColor(palette, alien.row),
  );

/** The invaders hit in this step. */
const alienBursts = (
  prev: PlayingState,
  next: PlayingState,
  palette: Palette,
): readonly (readonly Fragment[])[] =>
  startedEffects(next, 'alien')
    .map((effect) => hitAlien(prev, effect))
    .filter((alien) => alien !== undefined)
    .map((alien) => alienFragments(alien, palette));

/** The mystery ship, if it was hit in this step. */
const ufoBursts = (
  prev: PlayingState,
  next: PlayingState,
  palette: Palette,
): readonly (readonly Fragment[])[] =>
  prev.ufo.saucer && startedEffects(next, 'ufo').length > 0
    ? [spriteVoxels(ufoSprite, prev.ufo.saucer.x, UFO_Y, palette.ufo)]
    : [];

/** The cannon, if it was hit in this step. */
const cannonBursts = (
  prev: PlayingState,
  next: PlayingState,
  palette: Palette,
): readonly (readonly Fragment[])[] =>
  prev.cannonExplosion === undefined && next.cannonExplosion !== undefined
    ? [spriteVoxels(cannonSprite, prev.cannon.x, CANNON_Y, palette.cannon)]
    : [];

/** The pixels lit in `before` and gone in `after`: what a hit carved out of a shield. */
const carvedPixels = (before: Shield, after: Shield, color: string): readonly Fragment[] =>
  before.bitmap === after.bitmap
    ? []
    : before.bitmap.pixels
        .map((on, index) => ({ on, index }))
        .filter(({ on, index }) => on && after.bitmap.pixels[index] !== true)
        .map(({ index }) => ({
          x: before.x + (index % before.bitmap.width),
          y: before.y + Math.floor(index / before.bitmap.width),
          color,
        }));

/** The debris of every shield hit in this step. */
const shieldDebris = (
  prev: PlayingState,
  next: PlayingState,
  palette: Palette,
): readonly Fragment[] =>
  prev.shields.flatMap((shield, index) => {
    const after = next.shields[index];
    return after ? carvedPixels(shield, after, palette.cannon) : [];
  });

/** Everything that blew up between `prev` and `next`. */
export const findBursts = (prev: GameState, next: GameState): Bursts => {
  const before = playingOf(prev);
  const after = playingOf(next);
  if (!before || !after) return NO_BURSTS;
  const palette = paletteFor(next.colorMode);
  return {
    objects: [
      ...alienBursts(before, after, palette),
      ...ufoBursts(before, after, palette),
      ...cannonBursts(before, after, palette),
    ],
    debris: shieldDebris(before, after, palette),
  };
};
