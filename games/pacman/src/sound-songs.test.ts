import { describe, expect, it } from 'vitest';
import { SILENT_CHANNEL, type Channel, type ChannelOutput } from './sound-channel';
import { processSong } from './sound-songs';

/** The outputs of `frames` frames of song 1 from the song table at `table`. */
const run = (table: number, frames: number): readonly ChannelOutput[] =>
  Array.from({ length: frames }).reduce<{ channel: Channel; outputs: ChannelOutput[] }>(
    ({ channel, outputs }, _, frame) => {
      const output = processSong(channel, table, frame);
      return { channel: output.channel, outputs: [...outputs, output] };
    },
    { channel: { ...SILENT_CHANNEL, triggers: 1 }, outputs: [] },
  ).outputs;

describe('songs', () => {
  it('plays the start music: the low voice holds each note for 16 frames, fading', () => {
    const bass = run(0x3bc8, 20);
    expect(bass[0]?.frequency).toBe(0x5c << 3);
    expect(bass[0]?.volume).toBe(14);
    expect(bass[15]?.frequency).toBe(0x5c << 3);
    expect(bass[16]?.frequency).toBe(0);
  });

  it('plays the melody an octave apart on the other voice', () => {
    const melody = run(0x3bcc, 20).map((output) => output.frequency);
    expect(melody[0]).toBe(0x5c << 2);
    expect(melody).toContain(0x5c << 3);
  });

  it('stops at the end of the song', () => {
    const outputs = run(0x3bc8, 400);
    expect(outputs.at(-1)?.channel.triggers).toBe(0);
  });
});
