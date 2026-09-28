import { alienWidth, type Alien } from './aliens';
import { explosionSprite } from './sprites';

/** Short-lived things drawn on screen after a hit: explosions, splashes and the UFO's points. */
export type EffectKind = 'alien' | 'shot' | 'bomb' | 'ufo';

/** One effect on screen. */
export interface Effect {
  readonly kind: EffectKind;
  readonly x: number;
  readonly y: number;
  /** Frames before it disappears. */
  readonly framesLeft: number;
  /** Points shown by a `ufo` effect. */
  readonly points?: number;
}

/** How many frames each kind of effect stays on screen. */
export const EFFECT_FRAMES: Readonly<Record<EffectKind, number>> = {
  alien: 16,
  shot: 16,
  bomb: 16,
  ufo: 60,
};

/** A new effect of `kind` at (`x`, `y`). */
export const createEffect = (kind: EffectKind, x: number, y: number, points?: number): Effect => ({
  kind,
  x,
  y,
  framesLeft: EFFECT_FRAMES[kind],
  ...(points === undefined ? {} : { points }),
});

/** An explosion centered on the invader that was hit. */
export const explodeAlien = (alien: Alien): Effect =>
  createEffect(
    'alien',
    alien.x + Math.floor((alienWidth(alien) - explosionSprite.width) / 2),
    alien.y,
  );

/** Ages the effects by one frame and removes the ones that have finished. */
export const stepEffects = (effects: readonly Effect[]): readonly Effect[] =>
  effects
    .map((effect) => ({ ...effect, framesLeft: effect.framesLeft - 1 }))
    .filter((effect) => effect.framesLeft > 0);
