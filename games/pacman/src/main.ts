import './style.css';
import { createGameLoop } from '@arcade/engine-core';
import { boundKeys, createKeyboard } from '@arcade/input';
import { getCanvasContext } from '@arcade/render';
import { createHiScoreStore } from '@arcade/storage';
import { bindings, readControls } from './controls';
import { createGame, updateGame, type GameState } from './game';
import { createRenderer } from './renderer';
import { tuning } from './tuning.config';

const ctx = getCanvasContext('#screen');
const keyboard = createKeyboard(window, { captureKeys: boundKeys(bindings) });
const hiScores = createHiScoreStore('insert-coin/pacman/hi-score');

/** A canvas outside the page, as big as the screen, for the tiles: redrawn only where they change. */
const createTileLayer = (width: number, height: number): CanvasRenderingContext2D => {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not available for the tile layer');
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  return ctx;
};

/**
 * One frame: read the keyboard, update the pure game state, save the record when it grows.
 * This is the only place where logic meets input and storage.
 */
const step = (state: GameState): GameState => {
  const next = updateGame(state, readControls(keyboard.poll()));
  if (next.playing.hiScore > state.playing.hiScore) hiScores.save(next.playing.hiScore);
  return next;
};

createGameLoop({
  initialState: createGame(hiScores.load()),
  update: step,
  render: createRenderer(ctx, createTileLayer(ctx.canvas.width, ctx.canvas.height)),
  step: 1 / tuning.framesPerSecond,
}).start();
