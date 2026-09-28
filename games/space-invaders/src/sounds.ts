import type { Sound } from '@arcade/audio';
import { EFFECT_FRAMES, type EffectKind } from './effects';
import type { GameState } from './game';
import type { PlayingState } from './playing';

/** The sound effects of the game. */
export type SoundName =
  | 'coin'
  | 'shot'
  | 'alienHit'
  | 'ufo'
  | 'ufoHit'
  | 'cannonHit'
  | 'extraLife'
  | 'march0'
  | 'march1'
  | 'march2'
  | 'march3';

/** The four notes of the invaders' march, in the order they repeat. */
const MARCH_NOTES: readonly SoundName[] = ['march0', 'march1', 'march2', 'march3'];

/** Frames between two chirps of the mystery ship's warble. */
const UFO_WARBLE_FRAMES = 8;

/** One note of the march: a short, low square wave. Pitches chosen by ear, not from the original. */
const marchNote = (frequency: number): Sound => ({
  kind: 'tone',
  wave: 'square',
  from: frequency,
  to: frequency * 0.9,
  duration: 0.09,
  volume: 0.25,
});

/**
 * Sound effects synthesized in code, in the spirit of the original's analog sound board:
 * no audio files, only a few numbers per sound.
 */
export const sounds: Readonly<Record<SoundName, Sound>> = {
  /** A short rising chirp when a coin is accepted. */
  coin: { kind: 'tone', wave: 'square', from: 660, to: 1320, duration: 0.15, volume: 0.15 },
  /** The "pshh" of the laser: a short burst of filtered noise. */
  shot: { kind: 'noise', cutoff: 3500, duration: 0.2, volume: 0.25 },
  /** An invader hit: a fast falling tone. */
  alienHit: { kind: 'tone', wave: 'square', from: 900, to: 120, duration: 0.3, volume: 0.15 },
  /** One chirp of the mystery ship's high warble, repeated while it flies. */
  ufo: { kind: 'tone', wave: 'sawtooth', from: 1400, to: 900, duration: 0.12, volume: 0.06 },
  /** The mystery ship destroyed: a long falling tone. */
  ufoHit: { kind: 'tone', wave: 'square', from: 1600, to: 200, duration: 0.8, volume: 0.15 },
  /** The cannon destroyed: a long, dull rumble. */
  cannonHit: { kind: 'noise', cutoff: 600, duration: 1.2, volume: 0.4 },
  /** A bonus cannon: a bright rising tone. */
  extraLife: { kind: 'tone', wave: 'square', from: 500, to: 2000, duration: 0.6, volume: 0.12 },
  march0: marchNote(98),
  march1: marchNote(87),
  march2: marchNote(78),
  march3: marchNote(73),
};

/** The playing data of a state that has it: during play and on the game over screen. */
const playingOf = (state: GameState): PlayingState | undefined =>
  state.screen === 'attract' ? undefined : state.playing;

/** Whether an effect of `kind` appeared in this frame. */
const effectStarted = (state: PlayingState, kind: EffectKind): boolean =>
  state.effects.some((effect) => effect.kind === kind && effect.framesLeft === EFFECT_FRAMES[kind]);

/** Each rule names a sound and the change of state that triggers it. */
const PLAYING_SOUNDS: readonly (readonly [
  SoundName,
  (prev: PlayingState, next: PlayingState) => boolean,
])[] = [
  ['shot', (prev, next) => next.shotsFired > prev.shotsFired],
  ['alienHit', (_, next) => effectStarted(next, 'alien')],
  ['ufoHit', (_, next) => effectStarted(next, 'ufo')],
  [
    'cannonHit',
    (prev, next) => prev.cannonExplosion === undefined && next.cannonExplosion !== undefined,
  ],
  ['extraLife', (prev, next) => !prev.extraLifeAwarded && next.extraLifeAwarded],
  [
    'ufo',
    (_, next) => next.ufo.saucer !== undefined && next.ufo.saucer.age % UFO_WARBLE_FRAMES === 0,
  ],
];

/** The march note to play when the formation starts a new pass, if any. */
const marchSound = (prev: PlayingState, next: PlayingState): readonly SoundName[] => {
  const note = MARCH_NOTES[next.fleet.beat % MARCH_NOTES.length];
  return note && next.fleet.beat !== prev.fleet.beat ? [note] : [];
};

/**
 * The sounds to play for the step that turned `previous` into `next`.
 * Sounds are derived by comparing two states, so the game logic stays pure and unaware of audio.
 */
export const soundsFor = (previous: GameState, next: GameState): readonly SoundName[] => {
  if (previous.screen !== 'playing' && next.screen === 'playing') return ['coin'];
  const prev = playingOf(previous);
  const current = playingOf(next);
  if (previous.screen !== 'playing' || !prev || !current) return [];
  return [
    ...marchSound(prev, current),
    ...PLAYING_SOUNDS.filter(([, happened]) => happened(prev, current)).map(([name]) => name),
  ];
};
