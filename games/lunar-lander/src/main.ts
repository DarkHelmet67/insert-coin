import './style.css';
import { createGameLoop } from '@arcade/engine-core';
import { clearScreen, getCanvasContext } from '@arcade/render';
import { atariVectorFont, drawBeamLines, syncScreen, textToLines } from '@arcade/vector';
import { VIEWPORT } from './playfield';
import { tuning } from './tuning.config';

const ctx = getCanvasContext('#screen');

/** The title, until the game arrives: the first step only prepares the page. */
const title = textToLines(atariVectorFont, 'LUNAR LANDER', { x: 368, y: 400, scale: 2 });

createGameLoop({
  initialState: null,
  update: (state) => state,
  render: () => {
    const mapping = syncScreen(ctx, VIEWPORT, window.devicePixelRatio);
    clearScreen(ctx, '#000');
    drawBeamLines(ctx, title, mapping, tuning.beam);
  },
  step: 1 / tuning.framesPerSecond,
}).start();
