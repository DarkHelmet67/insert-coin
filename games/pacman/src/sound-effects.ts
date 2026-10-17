import {
  applyEnvelope,
  byte,
  highestBit,
  shifted,
  stopChannel,
  type Channel,
  type ChannelOutput,
} from './sound-channel';

/** Bytes per effect in the effect tables. */
const EFFECT_SIZE = 8;

/**
 * Starts effect `number` (1 for bit 0) from its 8 bytes in `table` ($2E32): the bytes fill the
 * channel from offset +3, and the envelope type comes from the high half of the volume.
 */
const startEffect = (channel: Channel, table: readonly number[], number: number): Channel => {
  const at = (number - 1) * EFFECT_SIZE;
  /** Byte `i` of the effect. */
  const read = (i: number): number => table[at + i] ?? 0;
  const loaded = {
    ...channel,
    wave: read(0),
    frequency: read(1),
    slide: read(2),
    length: read(3),
    step: read(4),
    repeats: read(5),
    level: read(6),
    levelStep: read(7),
    duration: read(3) & 0x7f,
    base: read(1),
    type: (read(6) >> 4) & 0x0f,
  };
  return (loaded.type & 0x08) === 0 ? { ...loaded, volume: loaded.level, dir: 0 } : loaded;
};

/**
 * The end of a step ($2E89): the next step starts; a reversing effect flips its slide, and
 * only every other step moves on the frequency and the volume ($2EAD).
 */
const nextStep = (channel: Channel): Channel => {
  const restarted = { ...channel, duration: channel.length & 0x7f };
  const reversing = (channel.length & 0x80) !== 0;
  const flipped = reversing
    ? { ...restarted, slide: byte(-channel.slide), dir: channel.dir ^ 1 }
    : restarted;
  if (reversing && (channel.dir & 1) === 0) return flipped;
  const frequency = byte(flipped.frequency + flipped.step);
  const level = byte(flipped.level + flipped.levelStep);
  return {
    ...flipped,
    frequency,
    base: frequency,
    level,
    volume: (flipped.type & 0x08) === 0 ? level : flipped.volume,
  };
};

/**
 * One frame of an effect channel (routine $2DEE): the highest effect asked for plays, from its
 * table entry when it starts; each frame its frequency slides, each step moves on its
 * frequency and volume, and after its last step it gives way to the next one.
 */
export const processEffect = (
  channel: Channel,
  table: readonly number[],
  counter: number,
): ChannelOutput => {
  const found = highestBit(channel.triggers);
  if (found === undefined) return stopChannel(channel);
  const started =
    (channel.current & found.bit) === 0
      ? startEffect({ ...channel, current: found.bit }, table, found.number)
      : channel;
  const ticked = { ...started, duration: byte(started.duration - 1) };
  if (ticked.duration === 0 && ticked.repeats !== 0) {
    const repeats = ticked.repeats - 1;
    if (repeats === 0) {
      return processEffect(
        { ...ticked, repeats, triggers: channel.triggers & ~found.bit },
        table,
        counter,
      );
    }
    return slide(nextStep({ ...ticked, repeats }), counter);
  }
  return slide(ticked.duration === 0 ? nextStep(ticked) : ticked, counter);
};

/** The frequency slides and is shifted by the effect's octave ($2ECD). */
const slide = (channel: Channel, counter: number): ChannelOutput => {
  const base = byte(channel.base + channel.slide);
  const octaves = (channel.wave & 0x70) >> 4;
  return applyEnvelope({ ...channel, base }, counter, shifted(base, octaves));
};
