import './style.css';
import { createGameLoop } from '@arcade/engine-core';
import { getCanvasContext } from '@arcade/render';
import { demoLines } from './demo';
import { renderLines } from './render';
import { tuning } from './tuning.config';

const ctx = getCanvasContext('#screen');

// Step 2 of the remake: a still screen with every drawing of the ROM. The loop keeps redrawing
// it, so the lines stay sharp when the window is resized or moved to another display.
createGameLoop({
  initialState: demoLines(),
  update: (lines) => lines,
  render: (lines) => renderLines(ctx, lines, window.devicePixelRatio),
  step: 1 / tuning.framesPerSecond,
}).start();
