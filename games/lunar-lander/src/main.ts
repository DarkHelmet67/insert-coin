import './style.css';
import { createGameLoop } from '@arcade/engine-core';
import { clearScreen, getCanvasContext } from '@arcade/render';
import { atariVectorFont, drawBeamLines, syncScreen, textToLines } from '@arcade/vector';
import { moduleLines } from './flame';
import { VIEWPORT } from './playfield';
import { tuning } from './tuning.config';

const ctx = getCanvasContext('#screen');

/**
 * Step 3 of the remake: the ROM drawings, before the game. The module turns one step every 4
 * frames, as with a rotate button held [P ROT.NI], with the flame of every thrust level.
 */
const demoLines = (frame: number) => {
  const orientation = (frame >> 2) % 32;
  const thrust = (frame >> 4) % 17;
  return [
    ...textToLines(atariVectorFont, 'LUNAR LANDER', { x: 368, y: 640, scale: 2, brightness: 12 }),
    ...moduleLines({ x: 380, y: 380, size: 'large', orientation, thrust, frame }),
    ...moduleLines({ x: 640, y: 380, size: 'small', orientation, thrust, frame }),
  ];
};

createGameLoop({
  initialState: 0,
  update: (frame) => frame + 1,
  render: (frame) => {
    const mapping = syncScreen(ctx, VIEWPORT, window.devicePixelRatio);
    clearScreen(ctx, '#000');
    drawBeamLines(ctx, demoLines(frame), mapping, tuning.beam);
  },
  step: 1 / tuning.framesPerSecond,
}).start();
