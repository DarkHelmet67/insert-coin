/**
 * The heartbeat of Asteroids [P $7588-$75BC]: two low notes, one after the other, each on for
 * 4 frames. The silence between them starts at 48 frames with every wave and shrinks by one
 * frame every 64, down to 8: the longer a wave lasts, the faster the heart beats.
 * The program keeps the rhythm in a few bytes of RAM; the remake keeps it in the game state,
 * and the sound only has to notice when a new beat starts.
 */
export interface Thump {
  /** Frames of silence between two beats [P $02FC]. */
  readonly pause: number;
  /** Frames left of the beat being played [P $6D]. */
  readonly on: number;
  /** Frames left of the silence [P $6E]. */
  readonly off: number;
  /** Whether the last beat was the higher note [P $6C]. */
  readonly high: boolean;
  /** Beats played so far: when it changes, a new beat starts. */
  readonly beats: number;
}

/** Frames of silence at the start of a wave [P $71DA]. */
export const THUMP_START_PAUSE = 0x30;

/** The shortest silence [P $6969]. */
export const THUMP_MIN_PAUSE = 8;

/** Frames a beat lasts [P $75B2]. */
export const BEAT_FRAMES = 4;

/** The rhythm at the start of a game [P $68F0]: the first beat is the lower note. */
export const newThump: Thump = { pause: THUMP_START_PAUSE, on: 0, off: 4, high: true, beats: 0 };

/** Every 64 frames the silence gets one frame shorter [P $6960]. */
export const speedUpThump = (thump: Thump, frame: number): Thump =>
  (frame & 0x3f) === 0 && thump.pause > THUMP_MIN_PAUSE
    ? { ...thump, pause: thump.pause - 1 }
    : thump;

/**
 * One frame of the heartbeat. It beats only while there are rocks and the ship is flying or in
 * hyperspace; otherwise it stays silent and the next silence starts from the full pause.
 */
export const updateThump = (thump: Thump, active: boolean): Thump => {
  if (!active) return { ...thump, off: thump.pause };
  if (thump.on > 0) {
    const on = thump.on - 1;
    return on > 0 ? { ...thump, on } : { ...thump, on, off: thump.pause };
  }
  const off = thump.off - 1;
  if (off > 0) return { ...thump, off };
  return { ...thump, on: BEAT_FRAMES, off, high: !thump.high, beats: thump.beats + 1 };
};
