import './style.css';
import { getCanvasContext } from '@arcade/render';
import { NO_FLIP } from '@arcade/tiles';
import { drawSprites } from './draw-sprites';
import { drawVideo } from './draw-video';
import { newMazeWrites } from './maze';
import type { HardwareSprite } from './sprites';
import { TEXT, textWrites } from './texts';
import { filledVideo, writeVideo } from './video';

const ctx = getCanvasContext('#screen');

// Step 2 shows the graphics decoded from the ROMs: the maze as the program draws it, the
// messages of a new game and the five actors where the program puts them before READY!.
const video = [TEXT.highScore, TEXT.playerOne, TEXT.ready].reduce(
  (screen, text) => writeVideo(screen, textWrites(text)),
  writeVideo(filledVideo(0x40, 0), newMazeWrites()),
);

/** The actors at the start of a level (task $04 at $2576): code, palette and position. */
const START_SPRITES: readonly HardwareSprite[] = [
  { code: 0x20, palette: 1, flip: NO_FLIP, x: 0x80, y: 0x64 },
  { code: 0x20, palette: 3, flip: NO_FLIP, x: 0x80, y: 0x7c },
  { code: 0x20, palette: 5, flip: NO_FLIP, x: 0x90, y: 0x7c },
  { code: 0x20, palette: 7, flip: NO_FLIP, x: 0x70, y: 0x7c },
  { code: 0x2c, palette: 9, flip: NO_FLIP, x: 0x80, y: 0xc4 },
];

drawVideo(ctx, video);
drawSprites(ctx, START_SPRITES);
