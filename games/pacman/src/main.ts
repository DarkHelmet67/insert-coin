import '@arcade/input/joystick.css';
import './style.css';
import { createAudio } from '@arcade/audio';
import { debugSafeHiScores, showDebugMark } from '@arcade/debug';
import { createGameLoop } from '@arcade/engine-core';
import { boundKeys, createKeyboard, createTouchControls, mergeKeyStates } from '@arcade/input';
import { enterFullscreenOnTouch, getCanvasContext, showFullscreenButton } from '@arcade/render';
import { createHiScoreStore } from '@arcade/storage';
import { bindings, readControls } from './controls';
import { debug } from './debug';
import { createGame, updateGame, type GameState } from './game';
import { createRenderer } from './renderer';
import { createSoundOutput } from './sound-output';
import { tuning } from './tuning.config';

const ctx = getCanvasContext('#screen');
const keyboard = createKeyboard(window, { captureKeys: boundKeys(bindings) });
const touch = createTouchControls(
  document.querySelector('#touch-panel') ?? document.body,
  tuning.touchControls,
  'four-way',
);
// On phones and tablets the first touch hides the browser's bars, where the browser allows it;
// the button brings the full screen back after leaving it.
enterFullscreenOnTouch();
showFullscreenButton(document.querySelector('#fullscreen'));
// In debug mode the DEBUG mark is shown and new records are not saved.
showDebugMark(debug.enabled);
const hiScores = debugSafeHiScores(
  createHiScoreStore('insert-coin/pacman/hi-score'),
  debug.enabled,
);
const audio = createAudio();
const playSound = createSoundOutput(audio);

/** A canvas outside the page, as big as the screen, for the tiles: redrawn only where they change. */
const createTileLayer = (width: number, height: number): CanvasRenderingContext2D => {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not available for the tile layer');
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  return ctx;
};

/**
 * One frame: read the keyboard and the touch buttons, update the pure game state, play its
 * sound, save the record when it grows. This is the only place where logic meets input, audio
 * and storage.
 */
const step = (state: GameState): GameState => {
  const controls = readControls(mergeKeyStates(keyboard.poll(), touch.poll()));
  if (controls.mute) audio.toggleMute();
  const next = updateGame(state, controls);
  playSound(next.playing.sounds, next.frame, next.playing.demo);
  if (next.playing.hiScore > state.playing.hiScore) hiScores.save(next.playing.hiScore);
  return next;
};

createGameLoop({
  initialState: createGame(hiScores.load()),
  update: step,
  render: createRenderer(ctx, createTileLayer(ctx.canvas.width, ctx.canvas.height)),
  step: 1 / tuning.framesPerSecond,
}).start();
