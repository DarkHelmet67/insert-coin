import { describe, expect, it } from 'vitest';
import { SILENT_CHANNEL, type Channel, type ChannelOutput } from './sound-channel';
import { processEffect } from './sound-effects';

/** A table with one effect: the siren of voice 2 at $3B40, and the "wakka" half at $3B80. */
const SIREN = [0x36, 0x20, 0x04, 0x8c, 0x00, 0x00, 0x06, 0x00];
const WAKKA = [0x42, 0x18, 0xfd, 0x06, 0x00, 0x01, 0x0c, 0x00];

/** The outputs of `frames` frames of an effect channel. */
const run = (table: readonly number[], frames: number): readonly ChannelOutput[] =>
  Array.from({ length: frames }).reduce<{ channel: Channel; outputs: ChannelOutput[] }>(
    ({ channel, outputs }, _, frame) => {
      const output = processEffect(channel, table, frame);
      return { channel: output.channel, outputs: [...outputs, output] };
    },
    { channel: { ...SILENT_CHANNEL, triggers: 1 }, outputs: [] },
  ).outputs;

describe('sound effects', () => {
  it('slides the siren up for 11 frames, then down, forever', () => {
    const frequencies = run(SIREN, 40).map((output) => output.frequency);
    expect(frequencies[0]).toBe(0x24 << 3);
    expect(frequencies[10]).toBe((0x24 + 40) << 3);
    expect(frequencies[11]).toBe((0x24 + 36) << 3);
    expect(frequencies[22]).toBe(0x1c << 3);
    expect(frequencies[39]).toBeGreaterThan(0);
    expect(run(SIREN, 40).every((output) => output.volume === 6)).toBe(true);
  });

  it('plays a half wakka, a 5-frame slide down, then stops', () => {
    const outputs = run(WAKKA, 10);
    expect(outputs[0]).toMatchObject({ frequency: 0x15 << 4, volume: 12 });
    expect(outputs[4]).toMatchObject({ frequency: 0x09 << 4, volume: 12 });
    expect(outputs[5]).toMatchObject({ frequency: 0, volume: 0 });
    expect(outputs[5]?.channel.triggers).toBe(0);
    expect(outputs[8]?.frequency).toBeUndefined();
  });
});
