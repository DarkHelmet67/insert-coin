import type { Sound, SoundEffect } from '@arcade/audio';
import { explosionVolume } from './explosion';
import { fuelUnits, isEmpty } from './fuel';
import type { GameState } from './game';
import { LOW_FUEL } from './render';
import { ABORT_THRUST, type ThrustLevel } from './thrust';
import { tuning } from './tuning.config';

/**
 * The sounds of a frame, read from the state the frame produced: the game logic knows nothing
 * about audio [P S.SND]. As on the cabinet there is sound only during a game, not in attract.
 * Continuous sounds are played as short pieces one after the other, as in Asteroids.
 */

const { sound } = tuning;

/** Seconds of `frames` frames. */
const seconds = (frames: number): number => frames / tuning.framesPerSecond;

/** Frames between two pieces of a continuous noise. */
export const CHUNK_FRAMES = 6;

/** The loudest noise level of the sound board: 3 bits [P S.SND]. */
const MAX_LEVEL = 7;

/**
 * Noise level of the engine [P MAINLP: THRUST / 2 + 1]: 1, 3, 5 or 7. Even with the lever down
 * the engine is heard, at the lowest level; ABORT is the loudest.
 */
export const rumbleLevel = (thrust: ThrustLevel): number =>
  ((thrust >= ABORT_THRUST ? 15 : thrust) >> 1) | 1;

/** A piece of noise, a little longer than the gap between two pieces so there are no holes. */
const noise = (cutoff: number, volume: number): Sound => ({
  kind: 'noise',
  cutoff,
  duration: seconds(CHUNK_FRAMES + 2),
  hold: seconds(CHUNK_FRAMES),
  fade: 'linear',
  volume,
});

/** The engine at `thrust`. */
export const rumble = (thrust: ThrustLevel): Sound =>
  noise(sound.rumble.cutoff, (sound.rumble.volume * rumbleLevel(thrust)) / MAX_LEVEL);

/** The explosion at step `step` of the crash sequence. */
export const blast = (step: number): Sound =>
  noise(sound.explosion.cutoff, (sound.explosion.volume * explosionVolume(step)) / 15);

/** The low-fuel beep: as long as LOW ON FUEL stays written, 16 frames. */
export const lowFuelBeep: Sound = {
  kind: 'tone',
  wave: 'square',
  from: sound.lowFuel.frequency,
  to: sound.lowFuel.frequency,
  duration: seconds(16),
  hold: seconds(16),
  fade: 'linear',
  volume: sound.lowFuel.volume,
};

/** Whether this frame starts a new piece of continuous noise. */
const chunkStarts = (frame: number): boolean => frame % CHUNK_FRAMES === 0;

/** The sounds to play for the frame that produced `state`. */
export const soundsFor = (state: GameState): readonly SoundEffect[] => {
  const { mode, frame } = state;
  if (mode.kind === 'flying') {
    const { tank } = mode.flight.flight;
    // LOW ON FUEL is written in the first 16 frames of every 32 [P STATUS].
    const beep =
      state.fuelLoss === null &&
      !isEmpty(tank) &&
      fuelUnits(tank) < LOW_FUEL &&
      (frame & 0x1f) === 0;
    return [
      ...(chunkStarts(frame) ? [rumble(mode.flight.thrust)] : []),
      ...(beep ? [lowFuelBeep] : []),
    ];
  }
  if (mode.kind === 'landed' && mode.outcome === 'crash' && chunkStarts(frame)) {
    return explosionVolume(mode.step) > 0 ? [blast(mode.step)] : [];
  }
  return [];
};
