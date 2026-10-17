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
import { createGame, updateGame, type GameState } from './game';
import { renderGame } from './render';
import { NO_SOUND_COMMANDS, soundCommands } from './sound-commands';
import { createSoundOutput } from './sound-output';
import { tuning } from './tuning.config';

const ctx = getCanvasContext('#screen');
const keyboard = createKeyboard(window, { captureKeys: boundKeys(bindings) });
const touch = createTouchControls(
  document.querySelector('#touch-panel') ?? document.body,
  tuning.touchControls,
  'left-right',
);
const audio = createAudio();
const playSound = createSoundOutput(audio);
// In debug mode the DEBUG mark is shown and new records are not saved.
showDebugMark(debug.enabled);
const hiScores = debugSafeHiScores(
  createHiScoreStore('insert-coin/galaga/hi-score'),
  debug.enabled,
);

/**
 * One frame: read keyboard and touch buttons, update the pure game state, play the frame's
 * sound, save the record when it grows. This is the only place where logic meets input, audio
 * and storage.
 */
const step = (state: GameState): GameState => {
  const controls = readControls(mergeKeyStates(keyboard.poll(), touch.poll()));
  if (controls.mute) audio.toggleMute();
  const next = updateGame(state, controls);
  playSound(next.screen === 'playing' ? soundCommands(next.playing) : NO_SOUND_COMMANDS);
  if (next.hiScore > state.hiScore) hiScores.save(next.hiScore);
  return next;
};

// The game advances in whole frames, 60 a second, as the cabinet does.
createGameLoop({
  initialState: createGame(hiScores.load()),
  update: step,
  render: (state) => renderGame(ctx, state),
}).start();
