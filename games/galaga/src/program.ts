/*
 * The main program of the cabinet (`game_ctrl.s`): the sequence of screens of a game, from
 * "PLAYER 1" to the stages, the "READY" after a lost fighter and the restarts. The original is a
 * loop that waits on timers while the tasks run; the remake keeps the point of the sequence it
 * has reached (`Phase`) and checks each frame whether the wait is over.
 */
import { buildAttackWaves } from './attack-waves';
import { newAttacks } from './attacks';
import { stageFlags } from './badges';
import { setTimer } from './clock';
import { debug } from './debug';
import { placeDualFighter, placeFighter } from './fighter';
import { initialFormation } from './formation';
import { scriptLines, startWait, waitOver, type ScriptName } from './endings';
import { eraseRow, MESSAGES, show, shownAt, stageMessage } from './messages';
import { ENEMY_OBJECTS, type Objects } from './objects';
import { flyingCount, play, type PlayingState } from './playing';
import { randomBytes } from './random';
import { isChallengeStage, stageLooks, stageParameters, starSpeedTarget } from './stage-setup';
import { startLauncher } from './wave-launcher';

/** Where the main program is, and what it does next. */
export type Phase =
  /** "PLAYER 1" while the start theme plays. */
  | { readonly step: 'intro' }
  /** "STAGE n" and the badges; then the first fighter, a new fighter or play. */
  | { readonly step: 'splash'; readonly then: 'playerUp' | 'respawn' | 'ready' }
  /** Waiting for the aliens to return home before a new fighter appears. */
  | { readonly step: 'respawn' }
  /** The new fighter is on screen; play resumes after a short pause. */
  | { readonly step: 'respawnDelay' }
  /** The stage is being played. */
  | { readonly step: 'running' }
  /** The stage is over or the fighter was lost: a pause before what comes next. */
  | { readonly step: 'restart' }
  /** A scripted sequence: challenge results or the end of the game (`endings.ts`). */
  | {
      readonly step: 'ending';
      readonly script: ScriptName;
      readonly line: number;
      readonly waiting: boolean;
    }
  /** The game is over: back to the attract screen. */
  | { readonly step: 'over' };

/** Frames between two badges, each with its "click" (`c_build_token_1`). */
const BADGE_FRAMES = 8;

/** Frames since the phase started are not kept: the badges use the frame counter. */
const badgeDue = (state: PlayingState): boolean => (state.frame & (BADGE_FRAMES - 1)) === 0;

/** Rows of the texts in the middle of the screen. */
const MESSAGE_ROW = 18;
const ABOVE_ROW = 16;

/** The aliens' hit notifications are cleared for the new stage. */
const clearHits = (objects: Objects): Objects =>
  objects.map((o, i) => (i < ENEMY_OBJECTS ? { ...o, hit: 0 } : o));

/** `stg_init_env`: the new stage's aliens, waves, grid and parameters. */
const setUpStage = (state: PlayingState): PlayingState => {
  // A fighter still held by the aliens comes back with the last wave (`l_2681`).
  const rogue = state.capture.busy && !state.dual;
  const waves = buildAttackWaves(state.stage, state.rank, randomBytes(state.frame), rogue);
  const params = stageParameters(state.stage, state.rank);
  return {
    ...state,
    timers: setTimer(setTimer(state.timers, 2, 120), 0, 2),
    looks: rogue
      ? new Map([...stageLooks(state.stage), [0x04, { code: 0x00, color: 7, bombs: true }]])
      : stageLooks(state.stage),
    launcher: startLauncher(waves.tokens),
    entryBombBits: waves.entryBombBits,
    bombInterval: waves.bombInterval,
    attacks: newAttacks(),
    maxBombers: params.maxBombers,
    flyingHits: 0,
    tripleLeft: 0,
    groupLeft: isChallengeStage(state.stage) ? 8 : 0,
    formation: initialFormation(),
    objects: clearHits(state.objects),
    tasks: { ...state.tasks, sway: true, breathing: false, attacks: false, clones: false },
    wavesEnabled: false,
    swayStops: false,
    params,
    starControl: { ...state.starControl, target: starSpeedTarget(state.stage) },
  };
};

/** `stg_init_splash`: next stage, its title and its badges. */
export const startSplash = (
  state: PlayingState,
  then: 'playerUp' | 'respawn' | 'ready',
): PlayingState => {
  const stage = state.stage + 1;
  const title = isChallengeStage(stage) ? MESSAGES.challengingStage : stageMessage(stage);
  const titled = {
    ...state,
    stage,
    badges: 0,
    messages: show(state.messages, title),
    timers: setTimer(state.timers, 2, 3),
    enemiesEnabled: true,
    phase: { step: 'splash', then } as const,
  };
  return isChallengeStage(stage) ? play(titled, 'challengeStart') : titled;
};

/** One frame of the stage title: a badge every 8 frames, then the pause runs out. */
const splash = (state: PlayingState, then: 'playerUp' | 'respawn' | 'ready'): PlayingState => {
  const total = stageFlags(state.stage).length;
  if (state.badges < total) {
    if (!badgeDue(state)) return state;
    const shown = { ...state, badges: state.badges + 1 };
    return isChallengeStage(state.stage) ? shown : play(shown, 'badge');
  }
  if (state.timers[2] !== 0) return state;
  const ready = setUpStage(state);
  switch (then) {
    case 'playerUp':
      return startRespawn({ ...ready, messages: show(ready.messages, MESSAGES.playerOneAbove) });
    case 'respawn':
      return startRespawn(ready);
    case 'ready':
      return startPlay(ready);
  }
};

/** `c_player_respawn`: "READY" unless the stage title is shown; wait for the aliens. */
const startRespawn = (state: PlayingState): PlayingState => ({
  ...state,
  tasks: { ...state.tasks, stick: true },
  messages: shownAt(state.messages, MESSAGES.ready.column, MESSAGE_ROW)
    ? state.messages
    : show(state.messages, MESSAGES.ready),
  phase: { step: 'respawn' },
});

/**
 * The new fighter at the start position. With the `startDual` debug option it is a double
 * fighter, and no Boss may try to capture it, as after a rescue.
 */
export const placeFighters = (
  state: PlayingState,
  startDual: boolean = debug.startDual,
): PlayingState =>
  startDual
    ? {
        ...state,
        objects: placeDualFighter(state.objects),
        dual: true,
        capture: { ...state.capture, busy: true },
      }
    : { ...state, objects: placeFighter(state.objects) };

/** `c_133A`: when nothing flies, the new fighter appears and the stars start moving. */
const respawn = (state: PlayingState): PlayingState => {
  if (flyingCount(state) !== 0) return state;
  const timer2 = Math.min(state.timers[2] + 0x1e, 0x78);
  return {
    ...placeFighters(state),
    starControl: { ...state.starControl, shipOnScreen: true },
    tasks: { ...state.tasks, fighterHits: true },
    restart: false,
    timers: setTimer(setTimer(state.timers, 2, timer2), 3, 3),
    phase: { step: 'respawnDelay' },
  };
};

/** `plyr_respawn_rdy`: the fire button works, waves may start, the texts go away. */
const startPlay = (state: PlayingState): PlayingState => ({
  ...state,
  tasks: { ...state.tasks, fire: true },
  wavesEnabled: true,
  messages: eraseRow(eraseRow(state.messages, MESSAGE_ROW), ABOVE_ROW),
  phase: { step: 'running' },
});

/** `gctl_supv_stage`: the stage ends when no alien is left, or restarts on a lost fighter. */
const running = (state: PlayingState): PlayingState => {
  if (state.alive === 0 && !state.launcher.running) {
    return startRestart(state);
  }
  return state.restart ? startRestart({ ...state, wavesEnabled: false }) : state;
};

/** `gctl_stg_restart_hdlr`: a pause of 4 timer ticks. */
const startRestart = (state: PlayingState): PlayingState => ({
  ...state,
  timers: setTimer(state.timers, 3, 4),
  phase: { step: 'restart' },
});

/**
 * After the pause: a lost fighter is replaced (or the game is over), a cleared stage is
 * followed by the next one.
 */
const restart = (state: PlayingState): PlayingState => {
  // `l_04A4`: a rescued fighter still landing takes the place of the lost one.
  if (state.capture.tasks.rescue) {
    const resumed = { ...state, restart: false, tasks: { ...state.tasks, fighterHits: true } };
    return state.alive > 0 ? { ...resumed, phase: { step: 'running' } } : resumed;
  }
  if (state.timers[3] !== 0) return state;
  if (state.restart || state.alive > 0) {
    if (state.reserve === 0) return startEnding(state, 'gameOver');
    const fewer = { ...state, reserve: state.reserve - 1 };
    return state.alive === 0 ? startSplash(fewer, 'respawn') : startRespawn(fewer);
  }
  if (isChallengeStage(state.stage)) {
    return startEnding(state, state.flyingHits === 40 ? 'perfect' : 'challenge');
  }
  return startSplash(state, 'ready');
};

/** The start of a scripted sequence. */
const startEnding = (state: PlayingState, script: ScriptName): PlayingState => ({
  ...state,
  phase: { step: 'ending', script, line: 0, waiting: false },
});

/**
 * One frame of a scripted sequence: run the next line, or wait. At the end, the next stage
 * follows the challenge results, the attract screen follows the game.
 */
const ending = (state: PlayingState, script: ScriptName, line: number, waiting: boolean) => {
  const lines = scriptLines(script, state);
  const current = lines[line];
  if (current === undefined) {
    return script === 'gameOver'
      ? { ...state, phase: { step: 'over' } as const }
      : startSplash(state, 'ready');
  }
  if (waiting) {
    return waitOver(state, current.wait)
      ? { ...state, phase: { step: 'ending', script, line: line + 1, waiting: false } as const }
      : state;
  }
  return {
    ...startWait(current.run(state), current.wait),
    phase: { step: 'ending', script, line, waiting: true } as const,
  };
};

/** The game at its first frame: "PLAYER 1" and the start theme for 8 timer ticks. */
export const startIntro = (state: PlayingState): PlayingState =>
  play(
    {
      ...state,
      messages: show(state.messages, MESSAGES.playerOne),
      timers: setTimer(state.timers, 3, 8),
      phase: { step: 'intro' },
    },
    'startTheme',
  );

/** One frame of the main program. */
export const runProgram = (state: PlayingState): PlayingState => {
  const { phase } = state;
  switch (phase.step) {
    case 'intro':
      return state.timers[3] === 0
        ? startSplash({ ...state, messages: eraseRow(state.messages, MESSAGE_ROW) }, 'playerUp')
        : state;
    case 'splash':
      return splash(state, phase.then);
    case 'respawn':
      return respawn(state);
    case 'respawnDelay':
      return state.timers[3] === 0 ? startPlay(state) : state;
    case 'running':
      return running(state);
    case 'restart':
      return restart(state);
    case 'ending':
      return ending(state, phase.script, phase.line, phase.waiting);
    case 'over':
      return state;
  }
};
