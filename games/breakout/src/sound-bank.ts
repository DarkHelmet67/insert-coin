import type { Sound, SoundEffect } from '@arcade/audio';
import { tuning } from './tuning.config';

/** The sound effects of the game. */
export type SoundName = 'paddle' | 'wall' | 'brick' | 'newRecord';

/** A plain square-wave beep, the only sound the circuit can make. */
const beep = ({ frequency, duration }: { frequency: number; duration: number }): Sound => ({
  kind: 'tone',
  wave: 'square',
  from: frequency,
  to: frequency,
  duration,
  hold: duration,
  fade: 'linear',
  volume: tuning.sounds.volume,
});

/**
 * One note of the new record fanfare: the same square wave as the other sounds, longer, so it
 * stands out without sounding foreign.
 */
const fanfareNote = (frequency: number, delay: number, duration: number): Sound => ({
  ...beep({ frequency, duration }),
  delay,
  hold: duration * 0.7,
});

/**
 * Sound effects synthesized in code, like the original's counters driving the speaker: no
 * audio files. Pitches and lengths are in `tuning.sounds`.
 */
export const sounds: Readonly<Record<SoundName, SoundEffect>> = {
  paddle: beep(tuning.sounds.paddle),
  wall: beep(tuning.sounds.wall),
  brick: beep(tuning.sounds.brick),
  /**
   * The record beaten during play (not in the original, which kept no record): a major
   * arpeggio climbing to the paddle's pitch, the last note held.
   */
  newRecord: [
    fanfareNote(500, 0, 0.12),
    fanfareNote(630, 0.14, 0.12),
    fanfareNote(750, 0.28, 0.12),
    fanfareNote(1000, 0.42, 0.6),
  ],
};
