/*
 * A stream of samples made by the game frame after frame, played back to back without gaps.
 * The game loop and the audio clock do not tick together, so the chunks are queued a little
 * ahead of the audio clock: far enough to survive a late frame, close enough not to lag.
 */

/** Seconds of sound queued ahead of the audio clock when the stream (re)starts. */
export const STREAM_LEAD = 0.06;

/** Seconds ahead beyond which a chunk is dropped: the game is catching up after a pause. */
export const STREAM_MAX_LEAD = 0.25;

/**
 * When the next chunk starts on the audio clock, given where the previous one ended (`cursor`)
 * and the time `now`; `undefined` drops the chunk. While queued sound is still playing the
 * chunk goes right after it, however little is left: restarting ahead would add a silence.
 */
export const nextChunkStart = (cursor: number, now: number): number | undefined => {
  if (cursor <= now) return now + STREAM_LEAD;
  if (cursor > now + STREAM_MAX_LEAD) return undefined;
  return cursor;
};
