import './style.css';
import { createAudio } from '@arcade/audio';
import { createGameLoop } from '@arcade/engine-core';
import { boundKeys, createKeyboard } from '@arcade/input';
import { getCanvasContext } from '@arcade/render';
import { createHiScoreStore } from '@arcade/storage';
import { bindings, readControls } from './controls';
import { createAttractState, updateGame, type GameState } from './game';
import { seedRandom } from './random';
import { renderGame } from './render';
import { sounds, soundsFor } from './sounds';
import { tuning } from './tuning.config';

const ctx = getCanvasContext('#screen');
const keyboard = createKeyboard(window, { captureKeys: boundKeys(bindings) });
const hiScores = createHiScoreStore('insert-coin/asteroids/hi-score');
const audio = createAudio();

/**
 * One frame: read the keyboard, update the pure game state, then play the sounds the change of
 * state calls for. The record changes only when a game ends, as on the cabinet, and is saved in
 * the browser right away. This is the only place where logic meets input, audio and storage.
 */
const step = (state: GameState): GameState => {
  const controls = readControls(keyboard.poll());
  if (controls.mute) audio.toggleMute();
  const next = updateGame(state, controls);
  soundsFor(state, next).forEach((name) => {
    audio.play(sounds[name]);
  });
  if (next.hiScore > state.hiScore) hiScores.save(next.hiScore);
  return next;
};

// The loop runs a fixed number of frames a second, so speeds are the same on every device.
createGameLoop({
  initialState: createAttractState(seedRandom(Date.now()), hiScores.load()),
  update: step,
  render: (state) => renderGame(ctx, state, window.devicePixelRatio),
  step: 1 / tuning.framesPerSecond,
}).start();
