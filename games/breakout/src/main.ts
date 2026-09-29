import './style.css';
import { createGameLoop } from '@arcade/engine-core';
import { boundKeys, createKeyboard, createPointerPosition } from '@arcade/input';
import { getCanvasContext } from '@arcade/render';
import { bindings, readControls } from './controls';
import { initialGameState, updateGame } from './game';
import { SCREEN_WIDTH } from './playfield';
import { renderGame } from './render';
import { tuning } from './tuning.config';

const ctx = getCanvasContext('#screen');
const keyboard = createKeyboard(window, { captureKeys: boundKeys(bindings) });
// The mouse or finger anywhere on the page moves the paddle: its x is read relative to the canvas.
const pointer = createPointerPosition({
  bounds: () => ctx.canvas.getBoundingClientRect(),
  logicalWidth: SCREEN_WIDTH,
});

// The loop runs at the frame rate of the original circuit, so speeds match it frame by frame.
createGameLoop({
  initialState: initialGameState,
  update: (state) => updateGame(state, readControls(keyboard.poll(), pointer.poll())),
  render: (state) => renderGame(ctx, state),
  step: 1 / tuning.framesPerSecond,
}).start();
