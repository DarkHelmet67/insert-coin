import './style.css';
import { createGameLoop } from '@arcade/engine-core';
import { boundKeys, createKeyboard } from '@arcade/input';
import { getCanvasContext } from '@arcade/render';
import { bindings, readControls } from './controls';
import { createGameState, updateGame, type GameState } from './game';
import { seedRandom } from './random';
import { renderGame } from './render';
import { tuning } from './tuning.config';

const ctx = getCanvasContext('#screen');
const keyboard = createKeyboard(window, { captureKeys: boundKeys(bindings) });

/** One frame: read the keyboard, then update the pure game state. */
const step = (state: GameState): GameState => updateGame(state, readControls(keyboard.poll()));

// The loop runs a fixed number of frames a second, so speeds are the same on every device.
createGameLoop({
  initialState: createGameState(seedRandom(Date.now())),
  update: step,
  render: (state) => renderGame(ctx, state, window.devicePixelRatio),
  step: 1 / tuning.framesPerSecond,
}).start();
