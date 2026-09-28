import { EFFECT_FRAMES, type EffectKind } from './effects';
import type { GameState } from './game';
import type { PlayingState } from './playing';
import type { SoundName } from './sound-bank';

export { sounds, type SoundName } from './sound-bank';

/** The four notes of the invaders' march, in the order they repeat. */
const MARCH_NOTES: readonly SoundName[] = ['march0', 'march1', 'march2', 'march3'];

/**
 * Frames between two chirps of the mystery ship's warble: one chirp lasts 0.163 s in the
 * original recording, about 10 frames.
 */
const UFO_WARBLE_FRAMES = 10;

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
