import './style.css';
import { createGameLoop } from '@arcade/engine-core';
import { boundKeys, createKeyboard } from '@arcade/input';
import { bindings, readControls } from './controls';
import { initialGameState, updateGame } from './game';
import { renderGame } from './render';

/** Finds the game canvas and its 2D context, failing loudly if the page is broken. */
const getScreen = (): CanvasRenderingContext2D => {
  const ctx = document.querySelector<HTMLCanvasElement>('#screen')?.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not available');
  return ctx;
};

const ctx = getScreen();
const keyboard = createKeyboard(window, { captureKeys: boundKeys(bindings) });

// The keyboard is polled once per simulation step, so every key press reaches exactly one update.
createGameLoop({
  initialState: initialGameState,
  update: (state, dt) => updateGame(state, readControls(keyboard.poll()), dt),
  render: (state) => renderGame(ctx, state),
}).start();
