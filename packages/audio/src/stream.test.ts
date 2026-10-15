import { describe, expect, it } from 'vitest';
import { nextChunkStart, STREAM_LEAD, STREAM_MAX_LEAD } from './stream';

describe('nextChunkStart', () => {
  it('starts a little ahead of the clock when the stream is new or has run dry', () => {
    expect(nextChunkStart(0, 10)).toBe(10 + STREAM_LEAD);
    expect(nextChunkStart(10, 10)).toBe(10 + STREAM_LEAD);
  });

  it('plays a chunk right after the previous one', () => {
    expect(nextChunkStart(10.05, 10)).toBe(10.05);
  });

  it('adds no silence while queued sound is still playing, however little is left', () => {
    expect(nextChunkStart(10.001, 10)).toBe(10.001);
  });

  it('drops a chunk when too much sound is already queued', () => {
    expect(nextChunkStart(10 + STREAM_MAX_LEAD + 0.01, 10)).toBeUndefined();
  });
});
