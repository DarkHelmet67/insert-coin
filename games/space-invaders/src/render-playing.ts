import {
  arcadeFont,
  drawCenteredText,
  drawSprite,
  drawText,
  type DrawingContext,
} from '@arcade/render';
import type { Alien } from './aliens';
import type { Bomb } from './bombs';
import { CANNON_Y } from './cannon';
import type { Effect } from './effects';
import { colorAt, colors } from './palette';
import type { PlayingState } from './playing';
import { renderGroundAndLives, renderHeader } from './render-hud';
import type { Shield } from './shields';
import {
  alienSprites,
  bombExplosionSprite,
  bombSprites,
  cannonExplosionSprites,
  cannonSprite,
  explosionSprite,
  shotExplosionSprite,
  shotSprite,
  ufoSprite,
} from './sprites';
import { UFO_Y } from './ufo';

/** Frames each picture of the cannon explosion stays on screen before switching. */
const CANNON_EXPLOSION_BLINK = 5;

/** Draws one invader in its current animation frame. */
const renderAlien = (ctx: DrawingContext, alien: Alien): void => {
  drawSprite(ctx, alienSprites[alien.kind][alien.frame], alien.x, alien.y, colorAt(alien.y));
};

/** Draws one bomb, animated as it falls. */
const renderBomb = (ctx: DrawingContext, bomb: Bomb): void => {
  const sprite = bombSprites[bomb.kind][bomb.steps % 4] ?? bombSprites[bomb.kind][0];
  drawSprite(ctx, sprite, bomb.x, bomb.y, colorAt(bomb.y));
};

/** Draws one shield with the holes carved so far. */
const renderShield = (ctx: DrawingContext, shield: Shield): void => {
  drawSprite(ctx, shield.bitmap, shield.x, shield.y, colors.cannon);
};

/** Draws an effect: an explosion, a splash, or the points scored on the mystery ship. */
const renderEffect = (ctx: DrawingContext, effect: Effect): void => {
  const color = colorAt(effect.y);
  switch (effect.kind) {
    case 'alien':
      drawSprite(ctx, explosionSprite, effect.x, effect.y, color);
      break;
    case 'shot':
      drawSprite(ctx, shotExplosionSprite, effect.x, effect.y, color);
      break;
    case 'bomb':
      drawSprite(ctx, bombExplosionSprite, effect.x, effect.y, color);
      break;
    case 'ufo':
      drawText(ctx, arcadeFont, String(effect.points ?? ''), effect.x, effect.y, colors.ufo);
      break;
  }
};

/** Draws the cannon, or its two-picture explosion while it is being destroyed. */
const renderCannon = (ctx: DrawingContext, state: PlayingState): void => {
  if (state.cannonExplosion === undefined) {
    drawSprite(ctx, cannonSprite, state.cannon.x, CANNON_Y, colors.cannon);
    return;
  }
  const picture = Math.floor(state.cannonExplosion / CANNON_EXPLOSION_BLINK) % 2;
  const sprite = cannonExplosionSprites[picture] ?? cannonExplosionSprites[0];
  drawSprite(ctx, sprite, state.cannon.x, CANNON_Y, colors.cannon);
};

/** Draws the playfield: header, shields, invaders, mystery ship, shots, bombs and cannon. */
export const renderPlaying = (ctx: DrawingContext, state: PlayingState, hiScore: number): void => {
  renderHeader(ctx, state.score, hiScore);
  state.shields.forEach((shield) => {
    renderShield(ctx, shield);
  });
  state.fleet.aliens.forEach((alien) => {
    renderAlien(ctx, alien);
  });
  if (state.ufo.saucer) drawSprite(ctx, ufoSprite, state.ufo.saucer.x, UFO_Y, colors.ufo);
  state.bombs.active.forEach((bomb) => {
    renderBomb(ctx, bomb);
  });
  state.effects.forEach((effect) => {
    renderEffect(ctx, effect);
  });
  if (state.shot) drawSprite(ctx, shotSprite, state.shot.x, state.shot.y, colorAt(state.shot.y));
  renderCannon(ctx, state);
  renderGroundAndLives(ctx, state.lives);
};

/** Draws the last picture of the game with "GAME OVER" on top of it. */
export const renderGameOver = (ctx: DrawingContext, state: PlayingState, hiScore: number): void => {
  renderPlaying(ctx, state, hiScore);
  drawCenteredText(ctx, arcadeFont, 'GAME OVER', 56, colors.ufo);
};
