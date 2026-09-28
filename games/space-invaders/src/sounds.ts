import type { Sound } from '@arcade/audio';
import type { GameState } from './game';

/** The sound effects of the game. */
export type SoundName = 'coin' | 'shot' | 'alienHit';

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
};

/** Whether this step turned the attract screen into a new game. */
const coinInserted = (previous: GameState, next: GameState): boolean =>
  previous.screen === 'attract' && next.screen === 'playing';

/**
 * The sounds to play for the step that turned `previous` into `next`.
 * Sounds are derived by comparing two states, so the game logic stays pure and unaware of audio.
 */
export const soundsFor = (previous: GameState, next: GameState): readonly SoundName[] => {
  if (coinInserted(previous, next)) return ['coin'];
  if (previous.screen !== 'playing' || next.screen !== 'playing') return [];
  const fired = previous.playing.shot === undefined && next.playing.shot !== undefined;
  const hit = next.playing.score > previous.playing.score;
  return [...(fired ? (['shot'] as const) : []), ...(hit ? (['alienHit'] as const) : [])];
};
