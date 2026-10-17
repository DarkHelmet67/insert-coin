import '@arcade/input/joystick.css';
import './style.css';
import { createAudio } from '@arcade/audio';
import { debugSafeHiScores, showDebugMark } from '@arcade/debug';
import { createGameLoop } from '@arcade/engine-core';
import { boundKeys, createKeyboard, createTouchControls, mergeKeyStates } from '@arcade/input';
import { getCanvasContext } from '@arcade/render';
import { createHiScoreStore } from '@arcade/storage';
import { bindings, readControls } from './controls';
import { debug } from './debug';
import { initialGameState, updateGame, type GameState } from './game';
import { renderGame } from './render';
import { sounds, soundsFor } from './sounds';
import { tuning } from './tuning.config';

const ctx = getCanvasContext('#screen');
const keyboard = createKeyboard(window, { captureKeys: boundKeys(bindings) });
const touch = createTouchControls(
  document.querySelector('#touch-panel') ?? document.body,
  tuning.touchControls,
  'left-right',
);
const audio = createAudio();
// In debug mode the DEBUG mark is shown and new records are not saved.
showDebugMark(debug.enabled);
const hiScores = debugSafeHiScores(
  createHiScoreStore('insert-coin/space-invaders/hi-score'),
  debug.enabled,
);

/**
 * One simulation step: read the controls, update the pure game state, then play the sounds
 * that the change of state calls for. This is the only place where logic meets input and audio.
 */
const step = (state: GameState, dt: number): GameState => {
  // Keyboard and touch buttons are polled once per step, so every press reaches exactly one
  // update; merged, they behave like two sets of buttons wired to the same cabinet.
  const controls = readControls(mergeKeyStates(keyboard.poll(), touch.poll()));
  if (controls.mute) audio.toggleMute();
  const next = updateGame(state, controls, dt);
  soundsFor(state, next).forEach((name) => {
    audio.play(sounds[name]);
  });
  // Saved as soon as it changes, so the record survives even if the page is closed mid-game.
  if (next.hiScore > state.hiScore) hiScores.save(next.hiScore);
  return next;
};

createGameLoop({
  initialState: { ...initialGameState, hiScore: hiScores.load() },
  update: step,
  render: (state) => renderGame(ctx, state),
}).start();
