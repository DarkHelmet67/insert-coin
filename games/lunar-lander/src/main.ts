import './style.css';
import { createAudio } from '@arcade/audio';
import { createGameLoop } from '@arcade/engine-core';
import { boundKeys, createKeyboard } from '@arcade/input';
import { clearScreen, getCanvasContext } from '@arcade/render';
import { createHiScoreStore } from '@arcade/storage';
import { drawBeamLines, syncScreen } from '@arcade/vector';
import { findPanel, panelView, showPanel } from './cabinet-panel';
import { bindings, readControls } from './controls';
import { createGame, updateGame, type GameState } from './game';
import { VIEWPORT } from './playfield';
import { gameLines } from './render';
import { soundsFor } from './sounds';
import { tuning } from './tuning.config';

const ctx = getCanvasContext('#screen');
const keyboard = createKeyboard(window, { captureKeys: boundKeys(bindings) });
const audio = createAudio();
const hiScores = createHiScoreStore('insert-coin/lunar-lander/hi-score');
const panel = findPanel(document);

/**
 * One frame: read the keyboard, update the pure game state, then play the sounds the new state
 * calls for and save the record when a game ends. This is the only place where logic meets
 * input, audio and storage.
 */
const step = (state: GameState): GameState => {
  const controls = readControls(keyboard.poll());
  if (controls.mute) audio.toggleMute();
  const next = updateGame(state, controls);
  soundsFor(next).forEach((effect) => {
    audio.play(effect);
  });
  if (next.hiScore > state.hiScore) hiScores.save(next.hiScore);
  return next;
};

// The loop runs a fixed number of frames a second, as the cabinet does every 24 ms.
createGameLoop({
  initialState: createGame(Date.now(), hiScores.load()),
  update: step,
  render: (state) => {
    const mapping = syncScreen(ctx, VIEWPORT, window.devicePixelRatio);
    clearScreen(ctx, '#000');
    drawBeamLines(ctx, gameLines(state), mapping, tuning.beam);
    showPanel(panel, panelView(state));
  },
  step: 1 / tuning.framesPerSecond,
}).start();
