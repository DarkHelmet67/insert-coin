/*
 * What the game asks of the sound processor in one frame, as the main processor writes its
 * trigger registers (`b_9AA0`): the sounds started in this frame, the sounds that last as long
 * as something happens, read from the state, and the direction of the breathing formation.
 */
import { isContinuous } from './combat';
import type { PlayingState } from './playing';
import type { SoundName } from './sound-names';
import { EFFECT } from './sound-state';

/** A write to a trigger register: effect and value. */
export type SoundWrite = readonly [effect: number, value: number];

/** The sound commands of one frame. */
export interface SoundCommands {
  readonly writes: readonly SoundWrite[];
  /** The fighter explodes: a noise from another chip, the 54XX (`b_9AA0[$19]`). */
  readonly explosion: boolean;
  /** `formatn_mv_signage`: 1 while the formation opens, $FF while it closes. */
  readonly sign: number;
}

/** Nothing to play: the attract screen. */
export const NO_SOUND_COMMANDS: SoundCommands = { writes: [], explosion: false, sign: 1 };

/** The effect each sound starts. */
const EFFECT_OF: Readonly<Record<Exclude<SoundName, 'fighterExplosion'>, number>> = {
  shot: EFFECT.shot,
  beeHit: EFFECT.beeHit,
  butterflyHit: EFFECT.butterflyHit,
  bossHit: EFFECT.bossHit,
  bossDamaged: EFFECT.bossDamaged,
  capturedFighterHit: EFFECT.capturedFighterHit,
  dive: EFFECT.dive,
  startTheme: EFFECT.startTheme,
  challengeStart: EFFECT.challengeStart,
  badge: EFFECT.badge,
  pulse: EFFECT.pulse,
  extraLife: EFFECT.extraLife,
  challengeEnd: EFFECT.challengeEnd,
  perfect: EFFECT.perfect,
  bonusBee: EFFECT.bonusBee,
};

/**
 * `l_226A`, `l_236D`: the beam hums while it opens, holds and closes; the main processor stops
 * it while a caught fighter waits for the next step of the beam, and while a shot Boss closes it.
 */
const beamHums = ({ capture }: PlayingState): boolean =>
  capture.tasks.beam &&
  capture.step !== 0 &&
  (capture.step & 0x80) === 0 &&
  !(capture.step === 0x40 && capture.tasks.pull);

/** `l_236D`-`l_22E3`: from the moment the fighter is caught to the end of the beam. */
const fighterPulled = ({ capture }: PlayingState): boolean =>
  capture.tasks.beam && (capture.tasks.pull || capture.connected);

/** `l_19C7`-`l_1A6A`: the captured fighter's tune, from the timer at 3 until it is home. */
const capturedTune = (state: PlayingState): boolean =>
  state.capture.tasks.carry && !state.capture.showText && state.timers[1] <= 3;

/** The sounds that last, and whether each one is on. */
const heldWrites = (state: PlayingState): readonly SoundWrite[] => [
  [EFFECT.tractorBeam, beamHums(state) ? 1 : 0],
  [EFFECT.beamCapture, fighterPulled(state) ? 1 : 0],
  [EFFECT.fighterCaptured, capturedTune(state) ? 1 : 0],
  [EFFECT.rescue, state.capture.tasks.rescue ? 1 : 0],
];

/**
 * `gctl_supv_stage`, `f_0857`: the pulsing sound stops when the stage is cleared and when the
 * last aliens bomb without pause; only the next breathing starts it again.
 */
const pulseStops = (state: PlayingState): boolean =>
  (state.alive === 0 && !state.launcher.running) || isContinuous(state);

/**
 * The formation's direction: the sign of the breathing counter before its last step. The
 * counter only changes sign at $1F, which steps to $A0, and at $81, which steps to $00.
 */
export const formationSign = (direction: number): number => {
  const previous = direction === 0xa0 ? 0x1f : direction === 0 ? 0x81 : direction;
  return (previous & 0x80) !== 0 ? 0xff : 1;
};

/** The sound commands of a frame of play. */
export const soundCommands = (state: PlayingState): SoundCommands => {
  const started = state.sounds.flatMap((name): readonly SoundWrite[] =>
    name === 'fighterExplosion' ? [] : [[EFFECT_OF[name], 1]],
  );
  return {
    writes: [
      ...started,
      ...heldWrites(state),
      ...(pulseStops(state) ? [[EFFECT.pulse, 0] as const] : []),
    ],
    explosion: state.sounds.includes('fighterExplosion'),
    sign: formationSign(state.formation.direction),
  };
};
