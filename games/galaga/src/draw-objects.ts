import type { DrawingContext } from '@arcade/render';
import { drawArt } from './draw-art';
import type { GameObject, Objects } from './objects';
import { spriteColors } from './palette';
import { SPRITE_OFFSET_X, SPRITE_OFFSET_Y } from './playfield';
import { bigSpriteArt, spriteArt } from './sprite-rom';

/** Draws one object's sprite, as the sprite hardware places it. */
const drawObject = (ctx: DrawingContext, object: GameObject): void => {
  const flip = { x: object.flipX, y: object.flipY };
  const left = object.x - SPRITE_OFFSET_X;
  const top = object.y - SPRITE_OFFSET_Y;
  const colors = spriteColors(object.color);
  if (object.big) {
    drawArt(ctx, bigSpriteArt(object.code & 0x7c, flip), left, top, colors);
  } else if (object.wide) {
    // A double width sprite puts code + 2 on the left and the code itself on the right.
    drawArt(ctx, spriteArt(object.code + 2, flip), left, top, colors);
    drawArt(ctx, spriteArt(object.code, flip), left + 16, top, colors);
  } else {
    drawArt(ctx, spriteArt(object.code, flip), left, top, colors);
  }
};

/**
 * Draws all objects in table order (later ones on top, like the hardware). An object at x = 0 is
 * off screen: the program hides sprites that way.
 */
export const drawObjects = (ctx: DrawingContext, objects: Objects): void => {
  objects.forEach((object) => {
    if (object.x !== 0) drawObject(ctx, object);
  });
};
