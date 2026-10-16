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
 * Where the top-left corner of a 16 × 16 sprite lands on the vertical screen (the interrupt
 * at $14A4 and MAME's sprite drawing). An actor in the middle of a tile (x and y ending in 4
 * in binary) is drawn centered on it: Pac-Man starts at $80,$C4, between columns 13 and 14 of
 * row 26.
 */
export const spriteScreenPosition = (sprite: Pick<HardwareSprite, 'x' | 'y'>): ScreenPoint => ({
  x: 232 - sprite.x,
  y: sprite.y + 8,
});
