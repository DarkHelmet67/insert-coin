import '@arcade/input/joystick.css';
import './style.css';
import { createAudio } from '@arcade/audio';
import { debugSafeHiScores, showDebugMark } from '@arcade/debug';
import { createGameLoop } from '@arcade/engine-core';
import { boundKeys, createKeyboard, createTouchControls, mergeKeyStates } from '@arcade/input';
import { getCanvasContext } from '@arcade/render';
import { bindings, readControls } from '@arcade/space-invaders/src/controls';
import { debug } from '@arcade/space-invaders/src/debug';
import { initialGameState, updateGame, type GameState } from '@arcade/space-invaders/src/game';
import { sounds, soundsFor } from '@arcade/space-invaders/src/sounds';
import { createHiScoreStore } from '@arcade/storage';
import { paintSky } from './sky';
import { tuning } from './tuning.config';
import { createView } from './view';

// The same cabinet as the original: keyboard, touch panel, sounds, debug switch. Only the
// screen is new.
const keyboard = createKeyboard(window, { captureKeys: boundKeys(bindings) });
const touch = createTouchControls(
  document.querySelector('#touch-panel') ?? document.body,
  tuning.touchControls,
  'left-right',
);
const audio = createAudio();
showDebugMark(debug.enabled);
// A record of its own: the same rules, but a different game on the site.
const hiScores = debugSafeHiScores(
  createHiScoreStore('insert-coin/space-invaders-25d/hi-score'),
  debug.enabled,
);

paintSky(document.documentElement, tuning.sky);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const view = createView(
  document.querySelector<HTMLCanvasElement>('#scene') ?? document.createElement('canvas'),
  getCanvasContext('#hud'),
  reducedMotion ? tuning.camera.reducedMotion : 1,
);

/**
 * One simulation step, as in the original main.ts: read the controls, update the pure game
 * state, play the sounds the change calls for, and let the view catch the explosions.
 */
const step = (state: GameState, dt: number): GameState => {
  const controls = readControls(mergeKeyStates(keyboard.poll(), touch.poll()));
  if (controls.mute) audio.toggleMute();
  const next = updateGame(state, controls, dt);
  soundsFor(state, next).forEach((name) => {
    audio.play(sounds[name]);
  });
  view.notice(state, next);
  if (next.hiScore > state.hiScore) hiScores.save(next.hiScore);
  return next;
};

createGameLoop({
  initialState: { ...initialGameState, hiScore: hiScores.load() },
  update: step,
  render: (state) => {
    view.render(state);
  },
}).start();
