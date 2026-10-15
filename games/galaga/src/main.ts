import './style.css';
import { createGameLoop } from '@arcade/engine-core';
import { boundKeys, createKeyboard, createTouchButtons, mergeKeyStates } from '@arcade/input';
import { getCanvasContext } from '@arcade/render';
import { createHiScoreStore } from '@arcade/storage';
import { bindings, readControls } from './controls';
import { createGame, updateGame, type GameState } from './game';
import { renderGame } from './render';

const ctx = getCanvasContext('#screen');
const keyboard = createKeyboard(window, { captureKeys: boundKeys(bindings) });
const touch = createTouchButtons(document.querySelector('#touch-panel') ?? document.body);
const hiScores = createHiScoreStore('insert-coin/galaga/hi-score');

/**
 * One frame: read keyboard and touch buttons, update the pure game state, save the record when
 * it grows. This is the only place where logic meets input and storage.
 */
const step = (state: GameState): GameState => {
  const controls = readControls(mergeKeyStates(keyboard.poll(), touch.poll()));
  const next = updateGame(state, controls);
  if (next.hiScore > state.hiScore) hiScores.save(next.hiScore);
  return next;
};

// The game advances in whole frames, 60 a second, as the cabinet does.
createGameLoop({
  initialState: createGame(hiScores.load()),
  update: step,
  render: (state) => renderGame(ctx, state),
}).start();
