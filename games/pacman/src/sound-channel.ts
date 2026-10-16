/**
 * One channel of the sound program (RAM $4E9C-$4EFB, 16 bytes each, after Frederic Vecoven's
 * notes in the Ms. Pac-Man disassembly). The same layout serves the effects and the songs; the
 * comments give each field's offset and its name in those notes.
 */
export interface Channel {
  /** +0 NUM: one bit per effect or song asked for; the highest one plays. */
  readonly triggers: number;
  /** +2 CUR_BIT: the bit playing now. */
  readonly current: number;
  /** +3: the waveform in bits 0-2, and for effects an octave shift in bits 4-6. */
  readonly wave: number;
  /** +4: effects: the starting frequency; songs: an octave shift added to each note. */
  readonly frequency: number;
  /** +5: effects: the frequency added at each frame. */
  readonly slide: number;
  /** +6: effects: frames per step in bits 0-6, bit 7 to reverse the slide at each step. */
  readonly length: number;
  /** +7: effects: the frequency added at each step. */
  readonly step: number;
  /** +8: effects: steps left, 0 for an endless effect. */
  readonly repeats: number;
  /** +9: the volume, with the envelope type in bits 4-7 for effects. */
  readonly level: number;
  /** +10: effects: the volume added at each step. */
  readonly levelStep: number;
  /** +11 TYPE: the envelope (0 steady, 1-4 fading, faster or slower); bit 3 mutes. */
  readonly type: number;
  /** +12 DURATION: frames left in the step or the note. */
  readonly duration: number;
  /** +13 DIR: effects: bit 0 flips at each reversing step; songs: the note byte. */
  readonly dir: number;
  /** +14 BASE_FREQ: the frequency before the octave shift. */
  readonly base: number;
  /** +15 VOL: the volume now. */
  readonly volume: number;
  /** +6, +7 for songs: the address of the next byte of the song. */
  readonly offset: number;
}

/** A silent channel, as RAM at power-on. */
export const SILENT_CHANNEL: Channel = {
  triggers: 0,
  current: 0,
  wave: 0,
  frequency: 0,
  slide: 0,
  length: 0,
  step: 0,
  repeats: 0,
  level: 0,
  levelStep: 0,
  type: 0,
  duration: 0,
  dir: 0,
  base: 0,
  volume: 0,
  offset: 0,
};

/** What a channel gives the chip after one frame. */
export interface ChannelOutput {
  readonly channel: Channel;
  /** The 16-bit frequency it writes, or `undefined` if it leaves the registers alone. */
  readonly frequency: number | undefined;
  readonly volume: number;
}

/** A byte, as the processor keeps it. */
export const byte = (value: number): number => value & 0xff;

/**
 * The highest bit set in `triggers` and its number, from 1 (bit 0) to 8 (bit 7), as the
 * search at $2E1B finds them; `undefined` if none.
 */
export const highestBit = (triggers: number): { bit: number; number: number } | undefined => {
  const number = [8, 7, 6, 5, 4, 3, 2, 1].find((n) => (triggers & (1 << (n - 1))) !== 0);
  return number === undefined ? undefined : { bit: 1 << (number - 1), number };
};

/**
 * Silences a channel whose sound has ended (routine $2DF4): once, it clears its state and the
 * frequency registers; then it does nothing.
 */
export const stopChannel = (channel: Channel): ChannelOutput =>
  channel.current === 0
    ? { channel, frequency: undefined, volume: 0 }
    : {
        channel: { ...channel, current: 0, dir: 0, base: 0, volume: 0 },
        frequency: 0,
        volume: 0,
      };

/** Frames between two fading steps for each envelope type; 0 for a steady volume. */
const FADE_EVERY = [0, 1, 2, 4, 8] as const;

/**
 * The channel after the envelope of this frame, with the volume it gives (routine $2EFE):
 * type 0 keeps the volume, types 1-4 lower it by one every 1, 2, 4 or 8 frames of the sound
 * counter ($4C84), down to 0. The ROM uses no other type.
 */
export const applyEnvelope = (
  channel: Channel,
  counter: number,
  frequency: number,
): ChannelOutput => {
  const every = FADE_EVERY[channel.type] ?? 0;
  const fades = every > 0 && (counter & (every - 1)) === 0;
  const level = channel.volume & 0x0f;
  if (!fades) return { channel, frequency, volume: channel.volume };
  if (level === 0) return { channel, frequency, volume: 0 };
  return { channel: { ...channel, volume: level - 1 }, frequency, volume: level - 1 };
};

/** The base frequency shifted up `octaves` octaves, on 16 bits (routine $2EE4). */
export const shifted = (base: number, octaves: number): number => (base << octaves) & 0xffff;
