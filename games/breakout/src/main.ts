import './style.css';
import { createGameLoop } from '@arcade/engine-core';
import { boundKeys, createKeyboard } from '@arcade/input';
import { getCanvasContext } from '@arcade/render';
import { bindings, readControls } from './controls';
import { initialGameState, updateGame } from './game';
import { renderGame } from './render';
import { tuning } from './tuning.config';

const ctx = getCanvasContext('#screen');
const keyboard = createKeyboard(window, { captureKeys: boundKeys(bindings) });

// The loop runs at the frame rate of the original circuit, so speeds match it frame by frame.
createGameLoop({
  initialState: initialGameState,
  update: (state) => updateGame(state, readControls(keyboard.poll())),
  render: (state) => renderGame(ctx, state),
  step: 1 / tuning.framesPerSecond,
}).start();
