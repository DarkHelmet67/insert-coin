import type { Sound, SoundEffect } from '@arcade/audio';

/** The sound effects of the game. */
export type SoundName =
  | 'coin'
  | 'shot'
  | 'alienHit'
  | 'ufo'
  | 'ufoHit'
  | 'cannonHit'
  | 'extraLife'
  | 'newRecord'
  | 'march0'
  | 'march1'
  | 'march2'
  | 'march3';

/**
 * One note of the march: a low sawtooth, softened by a filter like the RC filters of the
 * original circuit, held steady and cut short. Measured on the original recordings.
 */
const marchNote = (frequency: number): Sound => ({
  kind: 'tone',
  wave: 'sawtooth',
  from: frequency,
  to: frequency,
  cutoff: 500,
  duration: 0.1,
  hold: 0.075,
  fade: 'linear',
  volume: 0.35,
});

/**
 * One beep of the new record fanfare: the same square wave as the bonus cannon's 480 Hz tone,
 * so the two rewards sound related.
 */
const fanfareNote = (frequency: number, delay: number, duration: number): Sound => ({
  kind: 'tone',
  wave: 'square',
  from: frequency,
  to: frequency,
  delay,
  duration,
  hold: duration * 0.7,
  fade: 'linear',
  volume: 0.1,
});

/**
 * Sound effects synthesized in code, in the spirit of the original's analog sound board:
 * no audio files, only a few numbers per sound. The numbers come from measuring recordings of
 * the original cabinet (pitch over time, harmonics, volume envelope): see the game's guide.
 */
export const sounds: Readonly<Record<SoundName, SoundEffect>> = {
  /** A short rising chirp when a coin is accepted (the original has no coin sound). */
  coin: { kind: 'tone', wave: 'square', from: 660, to: 1320, duration: 0.15, volume: 0.15 },
  /**
   * The laser: a pitch that falls in straight lines, from about 1800 to 400 Hz in 0.19 s,
   * and starts again. The recording catches the end of one fall, a full one, and the start
   * of the next, with a hiss at the very beginning.
   */
  shot: [
    { kind: 'noise', cutoff: 4000, duration: 0.05, volume: 0.06 },
    {
      kind: 'tone',
      wave: 'triangle',
      sweep: 'linear',
      from: 800,
      to: 375,
      duration: 0.058,
      hold: 0.058,
      volume: 0.22,
    },
    {
      kind: 'tone',
      wave: 'triangle',
      sweep: 'linear',
      from: 1800,
      to: 450,
      delay: 0.058,
      duration: 0.2,
      hold: 0.05,
      fade: 'linear',
      volume: 0.2,
    },
    {
      kind: 'tone',
      wave: 'triangle',
      sweep: 'linear',
      from: 1790,
      to: 1330,
      delay: 0.248,
      duration: 0.085,
      fade: 'linear',
      volume: 0.07,
    },
  ],
  /** An invader hit: a high tone around 2.6 kHz that sags slightly and fades after 0.16 s. */
  alienHit: {
    kind: 'tone',
    wave: 'triangle',
    sweep: 'linear',
    from: 2660,
    to: 2420,
    duration: 0.33,
    hold: 0.16,
    fade: 'linear',
    volume: 0.15,
  },
  /**
   * One chirp of the mystery ship's warble: a quick rise from 780 to 2600 Hz, then a fall from
   * 2000 to 820 Hz, 0.163 s in all.
   */
  ufo: [
    {
      kind: 'tone',
      wave: 'triangle',
      from: 780,
      to: 3100,
      duration: 0.08,
      hold: 0.08,
      volume: 0.08,
    },
    {
      kind: 'tone',
      wave: 'triangle',
      from: 2000,
      to: 820,
      delay: 0.08,
      duration: 0.083,
      hold: 0.083,
      volume: 0.08,
    },
  ],
  /** The mystery ship destroyed: a long falling tone (no recording available: chosen by ear). */
  ufoHit: { kind: 'tone', wave: 'square', from: 1600, to: 200, duration: 0.8, volume: 0.15 },
  /** The cannon destroyed: 0.8 s of low noise, steady for 0.55 s, then fading. */
  cannonHit: {
    kind: 'noise',
    cutoff: 700,
    duration: 0.8,
    hold: 0.55,
    fade: 'linear',
    volume: 0.45,
  },
  /** A bonus cannon: the circuit analysis gives a 480 Hz tone; the length is chosen by ear. */
  extraLife: {
    kind: 'tone',
    wave: 'square',
    from: 480,
    to: 480,
    duration: 1,
    hold: 0.8,
    fade: 'linear',
    volume: 0.1,
  },
  /**
   * The hi-score beaten during play (not in the original): the bonus cannon's tone climbing
   * a major arpeggio, 480, 600, 720 and 960 Hz, with the last note held.
   */
  newRecord: [
    fanfareNote(480, 0, 0.12),
    fanfareNote(600, 0.14, 0.12),
    fanfareNote(720, 0.28, 0.12),
    fanfareNote(960, 0.42, 0.6),
  ],
  march0: marchNote(60),
  march1: marchNote(56),
  march2: marchNote(52),
  march3: marchNote(69),
};
