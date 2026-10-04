import './style.css';
import { createGameLoop } from '@arcade/engine-core';
import { boundKeys, createKeyboard } from '@arcade/input';
import { clearScreen, getCanvasContext } from '@arcade/render';
import { drawBeamLines, syncScreen } from '@arcade/vector';
import { bindings, readControls } from './controls';
import { createGame, updateGame, type GameState } from './game';
import { VIEWPORT } from './playfield';
import { gameLines } from './render';
import { tuning } from './tuning.config';

const ctx = getCanvasContext('#screen');
const keyboard = createKeyboard(window, { captureKeys: boundKeys(bindings) });

// The loop runs a fixed number of frames a second, as the cabinet does every 24 ms.
createGameLoop({
  initialState: createGame(Date.now(), 0),
  update: (state: GameState) => updateGame(state, readControls(keyboard.poll())),
  render: (state) => {
    const mapping = syncScreen(ctx, VIEWPORT, window.devicePixelRatio);
    clearScreen(ctx, '#000');
    drawBeamLines(ctx, gameLines(state), mapping, tuning.beam);
  },
  step: 1 / tuning.framesPerSecond,
}).start();
