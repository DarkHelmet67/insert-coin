import {
  applyEnvelope,
  byte,
  highestBit,
  shifted,
  stopChannel,
  type Channel,
  type ChannelOutput,
} from './sound-channel';
import { SOUND_DATA, SOUND_START } from './rom/sound-rom';

/** The byte of the ROM at `address`, inside the sound data. */
const rom = (address: number): number => SOUND_DATA[address - SOUND_START] ?? 0;

/** A little-endian word of the ROM. */
const romWord = (address: number): number => rom(address) | (rom(address + 1) << 8);

/** Note lengths in frames, by the top 3 bits of a note byte ($3BB0). */
const LENGTHS = 0x3bb0;
/** The base frequency of each of the 16 notes, by the low 4 bits ($3BB8); note 0 is a rest. */
const NOTES = 0x3bb8;

/** Song commands from $F0: what each does with the byte, or bytes, after it ($2F55-$2FAD). */
const command = (channel: Channel, code: number): Channel => {
  const next = rom(channel.offset);
  const after = { ...channel, offset: channel.offset + 1 };
  switch (code) {
    case 0xf0:
      return { ...channel, offset: romWord(channel.offset) };
    case 0xf1:
      return { ...after, wave: next };
    case 0xf2:
      return { ...after, frequency: next };
    case 0xf3:
      return { ...after, level: next };
    case 0xf4:
      return { ...after, type: next };
    case 0xff:
      return stopChannel({ ...channel, triggers: channel.triggers & ~channel.current }).channel;
    default:
      return channel;
  }
};

/**
 * A note byte ($2DA5): the top 3 bits give its length, 1 to 128 frames; the low 5 bits, when
 * not 0, give the note (its low 4 bits) and the octave (bit 4).
 */
const playNote = (channel: Channel, note: number): Channel => {
  const pitched = (note & 0x1f) !== 0;
  return {
    ...channel,
    dir: pitched ? note : channel.dir,
    volume: (channel.type & 0x08) === 0 ? channel.level : 0,
    duration: rom(LENGTHS + ((note >> 5) & 0x07)),
    base: pitched ? rom(NOTES + (note & 0x0f)) : channel.base,
  };
};

/** Bytes a song may read in one frame before we give up: the ROM songs need a handful. */
const MAX_BYTES = 64;

/**
 * Reads the song from its offset up to the next note ($2D72): commands are applied on the way.
 * The end mark stops the song but, like the ROM, goes on reading the bytes after it.
 */
const readToNote = (channel: Channel, budget = MAX_BYTES): Channel => {
  const code = rom(channel.offset);
  const after = { ...channel, offset: channel.offset + 1 };
  if (code < 0xf0 || budget === 0) return playNote(after, code);
  return readToNote(command(after, code), budget - 1);
};

/**
 * One frame of a song channel (routine $2D44): the highest song asked for plays from its
 * address in `table`; each note lasts its frames, then the next is read. The frequency is the
 * note's, one octave up for bit 4 of the note byte, then up the song's own octave shift.
 */
export const processSong = (channel: Channel, table: number, counter: number): ChannelOutput => {
  const found = highestBit(channel.triggers);
  if (found === undefined) return stopChannel(channel);
  const played =
    (channel.current & found.bit) === 0
      ? readToNote({
          ...channel,
          current: found.bit,
          offset: romWord(table + (found.number - 1) * 2),
        })
      : nextFrame(channel);
  const octaves = byte(((played.dir & 0x10) === 0 ? 0 : 1) + played.frequency);
  return applyEnvelope(played, counter, shifted(played.base, octaves));
};

/** A frame of the note playing; when it is over the next note is read ($2D66). */
const nextFrame = (channel: Channel): Channel => {
  const duration = byte(channel.duration - 1);
  return duration === 0 ? readToNote({ ...channel, duration }) : { ...channel, duration };
};
