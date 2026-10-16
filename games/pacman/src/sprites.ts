import type { Flip } from '@arcade/tiles';

/**
 * One of the 8 hardware sprites, as the program writes it: shape and palette in $4FF0-$4FFF,
 * position in $5060-$506F. The position uses the program's own coordinates (`x` grows to the
 * left on screen, `y` downwards); `spriteScreenPosition` turns them into pixels.
 */
export interface HardwareSprite {
  /** Shape 0-63 in ROM 5f. */
  readonly code: number;
  /** Palette 0-63; 0 hides the sprite. */
  readonly palette: number;
  readonly flip: Flip;
  readonly x: number;
  readonly y: number;
}

/** A point on screen, in pixels from the top-left corner. */
export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * Where the top-left corner of a 16 × 16 sprite lands on the vertical screen. The program
 * counts x from the right edge and y from 8 pixels below the top, and the hardware draws the
 * sprite with its center 8 pixels from that point, so an actor at the center of a tile is
 * drawn centered on it: Pac-Man at $80,$C4 sits between columns 13 and 14 of row 26.
 */
export const spriteScreenPosition = (sprite: Pick<HardwareSprite, 'x' | 'y'>): ScreenPoint => ({
  x: 233 - sprite.x,
  y: sprite.y + 8,
});
