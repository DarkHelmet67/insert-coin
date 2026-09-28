import './style.css';
import { createAudio } from '@arcade/audio';
import { createGameLoop } from '@arcade/engine-core';
import { boundKeys, createKeyboard } from '@arcade/input';
import { getCanvasContext } from '@arcade/render';
import { bindings, readControls } from './controls';
import { initialGameState, updateGame, type GameState } from './game';
import { renderGame } from './render';
import { sounds, soundsFor } from './sounds';

const ctx = getCanvasContext('#screen');
const keyboard = createKeyboard(window, { captureKeys: boundKeys(bindings) });
const audio = createAudio();

/**
 * One simulation step: read the controls, update the pure game state, then play the sounds
 * that the change of state calls for. This is the only place where logic meets input and audio.
 */
const step = (state: GameState, dt: number): GameState => {
  // The keyboard is polled once per step, so every key press reaches exactly one update.
  const controls = readControls(keyboard.poll());
  if (controls.mute) audio.toggleMute();
  const next = updateGame(state, controls, dt);
  soundsFor(state, next).forEach((name) => {
    audio.play(sounds[name]);
  });
  return next;
};

createGameLoop({
  initialState: initialGameState,
  update: step,
  render: (state) => renderGame(ctx, state),
}).start();
