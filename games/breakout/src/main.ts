import './style.css';
import { createAudio } from '@arcade/audio';
import { createGameLoop } from '@arcade/engine-core';
import { boundKeys, createKeyboard, createPointerPosition } from '@arcade/input';
import { getCanvasContext } from '@arcade/render';
import { createHiScoreStore } from '@arcade/storage';
import { bindings, readControls } from './controls';
import { initialGameState, updateGame, type GameState } from './game';
import { SCREEN_WIDTH } from './playfield';
import { renderGame } from './render';
import { sounds, soundsFor } from './sounds';
import { tuning } from './tuning.config';

const ctx = getCanvasContext('#screen');
const keyboard = createKeyboard(window, { captureKeys: boundKeys(bindings) });
// The mouse or finger anywhere on the page moves the paddle: its x is read relative to the canvas.
const pointer = createPointerPosition({
  bounds: () => ctx.canvas.getBoundingClientRect(),
  logicalWidth: SCREEN_WIDTH,
});
const audio = createAudio();
const hiScores = createHiScoreStore('insert-coin/breakout/hi-score');

/**
 * One frame: read the controls, update the pure game state, then play the sounds that the
 * change of state calls for. This is the only place where logic meets input, audio and storage.
 */
const step = (state: GameState): GameState => {
  const controls = readControls(keyboard.poll(), pointer.poll());
  if (controls.mute) audio.toggleMute();
  const next = updateGame(state, controls);
  soundsFor(state, next).forEach((name) => {
    audio.play(sounds[name]);
  });
  // Saved as soon as it changes, so the record survives even if the page is closed mid-game.
  if (next.hiScore > state.hiScore) hiScores.save(next.hiScore);
  return next;
};

// The loop runs a fixed number of frames a second, so speeds are the same on every device.
createGameLoop({
  initialState: { ...initialGameState, hiScore: hiScores.load() },
  update: step,
  render: (state) => renderGame(ctx, state),
  step: 1 / tuning.framesPerSecond,
}).start();
