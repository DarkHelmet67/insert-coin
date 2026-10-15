import './style.css';
import { createGameLoop } from '@arcade/engine-core';
import { clearScreen, getCanvasContext } from '@arcade/render';
import { drawArt } from './draw-art';
import { spriteColors } from './palette';
import { NO_FLIP } from './pixel-art';
import { bigSpriteArt, spriteArt } from './sprite-rom';
import { advanceStars, STARS_SLOW, visibleStars } from './stars';
import { drawCellText } from './text';

const ctx = getCanvasContext('#screen');

/** Work in progress: the ROM graphics on the moving starfield. */
interface Showcase {
  readonly frame: number;
  readonly stars: number;
}

/** Sprite codes and palettes shown on the test screen: the four ships of the game, upright. */
const SHIPS = [
  { code: 0x06, palette: 9 },
  { code: 0x0e, palette: 0 },
  { code: 0x0e, palette: 1 },
  { code: 0x16, palette: 2 },
  { code: 0x1e, palette: 3 },
] as const;

createGameLoop<Showcase>({
  initialState: { frame: 0, stars: 0 },
  update: (state) => ({ frame: state.frame + 1, stars: advanceStars(state.stars, STARS_SLOW) }),
  render: (state) => {
    clearScreen(ctx);
    visibleStars(state.stars, STARS_SLOW, state.frame).forEach((star) => {
      ctx.fillStyle = star.color;
      ctx.fillRect(star.x, star.y, 1, 1);
    });
    drawCellText(ctx, 'GALAGA', 11, 4, 0);
    drawCellText(ctx, '© 1981 NAMCO LTD.', 6, 32, 3);
    drawCellText(ctx, 'FIGHTER CAPTURED', 6, 28, 4);
    drawCellText(ctx, 'SPECIAL BONUS 10000 PTS', 2, 30, 5);
    SHIPS.forEach((ship, index) => {
      drawArt(ctx, spriteArt(ship.code, NO_FLIP), 20 + index * 40, 80, spriteColors(ship.palette));
    });
    Array.from({ length: 8 }, (_, tile) => tile).forEach((tile) => {
      drawArt(ctx, spriteArt(0x18 + tile, NO_FLIP), 8 + tile * 26, 120, spriteColors(3));
      drawArt(
        ctx,
        spriteArt(0x50 + tile * 8 - 64 * Math.floor(tile / 6), NO_FLIP),
        8 + tile * 26,
        150,
        spriteColors(5 + tile),
      );
    });
    drawArt(ctx, bigSpriteArt(0x44, NO_FLIP), 40, 180, spriteColors(0x0a));
    drawArt(ctx, bigSpriteArt(0x48, NO_FLIP), 90, 180, spriteColors(0x0a));
    drawArt(ctx, bigSpriteArt(0x20, NO_FLIP), 140, 180, spriteColors(0x0a));
  },
}).start();
