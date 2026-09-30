import './style.css';
import { createGameLoop } from '@arcade/engine-core';
import { boundKeys, createKeyboard } from '@arcade/input';
import { getCanvasContext } from '@arcade/render';
import { createHiScoreStore } from '@arcade/storage';
import { bindings, readControls } from './controls';
import { createGameState, updateGame, type GameState } from './game';
import { seedRandom } from './random';
import { renderGame } from './render';
import { tuning } from './tuning.config';

const ctx = getCanvasContext('#screen');
const keyboard = createKeyboard(window, { captureKeys: boundKeys(bindings) });
const hiScores = createHiScoreStore('insert-coin/asteroids/hi-score');

/**
 * One frame: read the keyboard, then update the pure game state. The record changes only when a
 * game ends, as on the cabinet, and is saved in the browser right away.
 */
const step = (state: GameState): GameState => {
  const next = updateGame(state, readControls(keyboard.poll()));
  if (next.hiScore > state.hiScore) hiScores.save(next.hiScore);
  return next;
};

// The loop runs a fixed number of frames a second, so speeds are the same on every device.
createGameLoop({
  initialState: createGameState(seedRandom(Date.now()), hiScores.load()),
  update: step,
  render: (state) => renderGame(ctx, state, window.devicePixelRatio),
  step: 1 / tuning.framesPerSecond,
}).start();
