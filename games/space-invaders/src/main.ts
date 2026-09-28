import './style.css';
import { createAudio } from '@arcade/audio';
import { createGameLoop } from '@arcade/engine-core';
import { boundKeys, createKeyboard, createTouchButtons, mergeKeyStates } from '@arcade/input';
import { getCanvasContext } from '@arcade/render';
import { createHiScoreStore } from '@arcade/storage';
import { bindings, readControls } from './controls';
import { initialGameState, updateGame, type GameState } from './game';
import { renderGame } from './render';
import { sounds, soundsFor } from './sounds';

const ctx = getCanvasContext('#screen');
const keyboard = createKeyboard(window, { captureKeys: boundKeys(bindings) });
const touch = createTouchButtons(document.querySelector('#touch-panel') ?? document.body);
const audio = createAudio();
const hiScores = createHiScoreStore('insert-coin/space-invaders/hi-score');

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
