import './style.css';
import { createGameLoop } from '@arcade/engine-core';
import { boundKeys, createKeyboard } from '@arcade/input';
import { getCanvasContext } from '@arcade/render';
import { bindings, readControls } from './controls';
import { initialGameState, updateGame } from './game';
import { renderGame } from './render';

const ctx = getCanvasContext('#screen');
const keyboard = createKeyboard(window, { captureKeys: boundKeys(bindings) });

// The keyboard is polled once per simulation step, so every key press reaches exactly one update.
createGameLoop({
  initialState: initialGameState,
  update: (state, dt) => updateGame(state, readControls(keyboard.poll()), dt),
  render: (state) => renderGame(ctx, state),
}).start();
