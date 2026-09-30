import type { GameState } from './game';
import type { RockSize, RockSlot } from './rocks';
import type { SaucerSlot } from './saucer';
import { SAUCER_WARBLE_FRAMES, THRUST_CHUNK_FRAMES, type SoundName } from './sound-bank';
import type { ShotSlots } from './shots';

export { sounds, type SoundName } from './sound-bank';

/**
 * Which sounds a frame calls for, found by comparing the state before and after it: the game
 * logic stays pure and knows nothing about audio. As on the cabinet, there is sound only during
 * a game, not on the attract screen [P $7555].
 */

/** The explosion of each rock size [P $6B4A]: the larger the rock, the deeper the noise. */
const ROCK_EXPLOSION: Readonly<Record<RockSize, SoundName>> = {
  4: 'explosionLow',
  2: 'explosionMid',
  1: 'explosionHigh',
};

/** Whether a slot became an explosion in this frame. */
const startedExploding = (before: RockSlot | SaucerSlot, after: RockSlot | SaucerSlot): boolean =>
  before?.kind !== 'explosion' && after?.kind === 'explosion';

/** Whether any slot got a new shot in this frame. */
const newShot = (before: ShotSlots, after: ShotSlots): boolean =>
  after.some((shot, i) => shot !== null && before[i] === null);

/** The explosions of rocks and saucer that started in this frame. */
const explosions = (prev: GameState, next: GameState): readonly SoundName[] => {
  const rocks = next.rocks.flatMap((slot, i): readonly SoundName[] => {
    const before = prev.rocks[i];
    return before?.kind === 'rock' && startedExploding(before, slot)
      ? [ROCK_EXPLOSION[before.size]]
      : [];
  });
  const saucer: readonly SoundName[] =
    prev.saucer?.kind === 'saucer' && startedExploding(prev.saucer, next.saucer)
      ? [prev.saucer.size === 'large' ? 'explosionLow' : 'explosionMid']
      : [];
  return [...new Set<SoundName>([...rocks, ...saucer])];
};

/**
 * The ship's explosion, when nothing else exploded with it (running into a rock sounds like the
 * rock): a failed hyperspace jump is deep, a shot is mid [P $6B66, $706F].
 */
const shipExplosion = (prev: GameState, next: GameState): readonly SoundName[] => {
  if (prev.life.kind === 'exploding' || next.life.kind !== 'exploding') return [];
  return [prev.life.kind === 'hidden' ? 'explosionLow' : 'explosionMid'];
};

/** The saucer's siren, one warble at a time while it flies. */
const siren = (next: GameState): readonly SoundName[] => {
  const { saucer } = next;
  if (saucer?.kind !== 'saucer') return [];
  if (next.frame % SAUCER_WARBLE_FRAMES[saucer.size] !== 0) return [];
  return [saucer.size === 'large' ? 'saucerLarge' : 'saucerSmall'];
};

/** The thrust rumble, one piece at a time while the button is held. */
const thrust = (next: GameState): readonly SoundName[] =>
  next.life.kind === 'flying' && next.ship.thrusting && next.frame % THRUST_CHUNK_FRAMES === 0
    ? ['thrust']
    : [];

/** A new beat of the heart, low or high. */
const heartbeat = (prev: GameState, next: GameState): readonly SoundName[] => {
  if (next.thump.beats === prev.thump.beats) return [];
  return [next.thump.high ? 'thumpHigh' : 'thumpLow'];
};

/** The sounds to play for the frame that turned `prev` into `next`. */
export const soundsFor = (prev: GameState, next: GameState): readonly SoundName[] => {
  if (prev.phase !== 'playing' || next.phase !== 'playing') return [];
  const booms = explosions(prev, next);
  return [
    ...heartbeat(prev, next),
    ...(newShot(prev.shots, next.shots) ? (['fire'] as const) : []),
    ...(newShot(prev.saucerShots, next.saucerShots) ? (['saucerFire'] as const) : []),
    ...thrust(next),
    ...siren(next),
    ...booms,
    ...(booms.length === 0 ? shipExplosion(prev, next) : []),
    ...(next.lives > prev.lives ? (['extraLife'] as const) : []),
  ];
};
