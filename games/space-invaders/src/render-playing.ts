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
import { alienColor, type Palette } from './palette';
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

/** Draws one invader in its current animation frame, in the color of its formation row. */
const renderAlien = (ctx: DrawingContext, alien: Alien, palette: Palette): void => {
  const sprite = alienSprites[alien.kind][alien.frame];
  drawSprite(ctx, sprite, alien.x, alien.y, alienColor(palette, alien.row));
};

/** Draws one bomb, animated as it falls. */
const renderBomb = (ctx: DrawingContext, bomb: Bomb, palette: Palette): void => {
  const sprite = bombSprites[bomb.kind][bomb.steps % 4] ?? bombSprites[bomb.kind][0];
  drawSprite(ctx, sprite, bomb.x, bomb.y, palette.shots);
};

/** Draws one shield with the holes carved so far. */
const renderShield = (ctx: DrawingContext, shield: Shield, palette: Palette): void => {
  drawSprite(ctx, shield.bitmap, shield.x, shield.y, palette.cannon);
};

/** Draws an effect: an explosion, a splash, or the points scored on the mystery ship. */
const renderEffect = (ctx: DrawingContext, effect: Effect, palette: Palette): void => {
  switch (effect.kind) {
    case 'alien':
      drawSprite(ctx, explosionSprite, effect.x, effect.y, palette.text);
      break;
    case 'shot':
      drawSprite(ctx, shotExplosionSprite, effect.x, effect.y, palette.shots);
      break;
    case 'bomb':
      drawSprite(ctx, bombExplosionSprite, effect.x, effect.y, palette.shots);
      break;
    case 'ufo':
      drawText(ctx, arcadeFont, String(effect.points ?? ''), effect.x, effect.y, palette.ufo);
      break;
  }
};

/** Draws the cannon, or its two-picture explosion while it is being destroyed. */
const renderCannon = (ctx: DrawingContext, state: PlayingState, palette: Palette): void => {
  if (state.cannonExplosion === undefined) {
    drawSprite(ctx, cannonSprite, state.cannon.x, CANNON_Y, palette.cannon);
    return;
  }
  const picture = Math.floor(state.cannonExplosion / CANNON_EXPLOSION_BLINK) % 2;
  const sprite = cannonExplosionSprites[picture] ?? cannonExplosionSprites[0];
  drawSprite(ctx, sprite, state.cannon.x, CANNON_Y, palette.cannon);
};

/** Draws the playfield: header, shields, invaders, mystery ship, shots, bombs and cannon. */
export const renderPlaying = (
  ctx: DrawingContext,
  state: PlayingState,
  hiScore: number,
  palette: Palette,
): void => {
  renderHeader(ctx, state.score, hiScore, palette);
  state.shields.forEach((shield) => {
    renderShield(ctx, shield, palette);
  });
  state.fleet.aliens.forEach((alien) => {
    renderAlien(ctx, alien, palette);
  });
  if (state.ufo.saucer) drawSprite(ctx, ufoSprite, state.ufo.saucer.x, UFO_Y, palette.ufo);
  state.bombs.active.forEach((bomb) => {
    renderBomb(ctx, bomb, palette);
  });
  state.effects.forEach((effect) => {
    renderEffect(ctx, effect, palette);
  });
  if (state.shot) drawSprite(ctx, shotSprite, state.shot.x, state.shot.y, palette.shots);
  renderCannon(ctx, state, palette);
  renderGroundAndLives(ctx, state.lives, palette);
};

/** Draws the last picture of the game with "GAME OVER" on top of it. */
export const renderGameOver = (
  ctx: DrawingContext,
  state: PlayingState,
  hiScore: number,
  palette: Palette,
): void => {
  renderPlaying(ctx, state, hiScore, palette);
  drawCenteredText(ctx, arcadeFont, 'GAME OVER', 56, palette.ufo);
};
