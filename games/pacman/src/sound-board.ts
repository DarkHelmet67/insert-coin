import { decodeWaveforms, newChip, renderChip, type WsgChip, type WsgVoice } from '@arcade/wsg';
import { SOUND_DATA, SOUND_START, WAVEFORM_PROM } from './rom/sound-rom';
import { SILENT_CHANNEL, type Channel, type ChannelOutput } from './sound-channel';
import { processEffect } from './sound-effects';
import { processSong } from './sound-songs';
import { tuning } from './tuning.config';
import { QUIET_SPEAKER, throughSpeaker, type Speaker } from './speaker';

/** Samples a second sent to the browser: half the chip's rate. */
export const SAMPLE_RATE = 48000;

/** The effect tables of the three voices, and the song tables ($3B30, $3B40, $3B80; $3BC8...). */
const EFFECT_TABLES = [0x3b30, 0x3b40, 0x3b80].map((address) =>
  SOUND_DATA.slice(address - SOUND_START),
);
const SONG_TABLES = [0x3bc8, 0x3bcc, 0x3bd0];

const WAVEFORMS = decodeWaveforms(WAVEFORM_PROM);

/** The trigger bytes the game writes: the effects of voices 1-3, then their songs. */
export const SOUND_CHANNEL = {
  effect1: 0,
  effect2: 1,
  effect3: 2,
  song1: 3,
  song2: 4,
  song3: 5,
} as const;

/**
 * A write of the game to a trigger byte, as the processor does it: the bits in `keep` stay,
 * then the bits in `set` are set. `SET n` keeps all and sets one, `RES n` keeps all but one,
 * a plain store keeps none.
 */
export interface SoundWrite {
  readonly channel: number;
  readonly keep: number;
  readonly set: number;
}

/** The registers of one voice of the chip, as the program keeps them in RAM ($4E8C-$4E9B). */
interface VoiceRegisters {
  readonly frequency: number;
  readonly volume: number;
}

/** The sound side of the machine between two frames. */
export interface SoundBoard {
  /** The six channels: 3 effects, then 3 songs. */
  readonly channels: readonly Channel[];
  readonly registers: readonly VoiceRegisters[];
  readonly chip: WsgChip;
  readonly speaker: Speaker;
}

/** The board at power-on. */
export const newSoundBoard = (): SoundBoard => ({
  channels: Array.from({ length: 6 }, () => SILENT_CHANNEL),
  registers: Array.from({ length: 3 }, () => ({ frequency: 0, volume: 0 })),
  chip: newChip(),
  speaker: QUIET_SPEAKER,
});

/** The game's writes applied to the trigger bytes. */
const applyWrites = (channels: readonly Channel[], writes: readonly SoundWrite[]) =>
  writes.reduce(
    (all, write) =>
      all.map((channel, i) =>
        i === write.channel
          ? { ...channel, triggers: ((channel.triggers & write.keep) | write.set) & 0xff }
          : channel,
      ),
    channels,
  );

/**
 * The chip's voices from the registers (interrupt at $009D): voice 1 takes 5 frequency
 * nibbles, voices 2 and 3 only the top 4, so the program's 16-bit value is 16 times higher
 * for them. The waveform is the song's while one plays, otherwise the effect's.
 */
const voicesOf = (board: SoundBoard): readonly WsgVoice[] =>
  board.registers.map((registers, voice) => {
    const song = board.channels[voice + 3] ?? SILENT_CHANNEL;
    const effect = board.channels[voice] ?? SILENT_CHANNEL;
    return {
      frequency: voice === 0 ? registers.frequency : (registers.frequency << 4) & 0xfffff,
      volume: registers.volume & 0x0f,
      waveform: (song.triggers !== 0 ? song.wave : effect.wave) & 0x07,
    };
  });

/** The registers after a channel's output: a frequency, if it writes one, and its volume. */
const written = (
  registers: VoiceRegisters,
  output: ChannelOutput,
  volume: boolean,
): VoiceRegisters => ({
  frequency: output.frequency ?? registers.frequency,
  volume: volume ? output.volume : registers.volume,
});

/**
 * One frame of the sound program (routines $2D0C then $2CC1): the effects of the 3 voices,
 * then their songs. A song's volume counts only while a song is asked for.
 */
const processChannels = (board: SoundBoard, counter: number): SoundBoard => {
  const effects = EFFECT_TABLES.map((table, voice) =>
    processEffect(board.channels[voice] ?? SILENT_CHANNEL, table, counter),
  );
  const afterEffects = board.registers.map((registers, voice) =>
    written(
      registers,
      effects[voice] ?? { channel: SILENT_CHANNEL, frequency: 0, volume: 0 },
      true,
    ),
  );
  const songs = SONG_TABLES.map((table, voice) =>
    processSong(board.channels[voice + 3] ?? SILENT_CHANNEL, table, counter),
  );
  return {
    ...board,
    channels: [...effects, ...songs].map((output) => output.channel),
    registers: afterEffects.map((registers, voice) => {
      const song = songs[voice];
      return song === undefined ? registers : written(registers, song, song.channel.triggers !== 0);
    }),
  };
};

/** The sound of one frame, and the board after it. */
export interface SoundFrame {
  readonly board: SoundBoard;
  readonly samples: Float32Array<ArrayBuffer>;
}

/** Samples per frame: 792 at 60.606 frames a second. */
const SAMPLES_PER_FRAME = Math.round(SAMPLE_RATE / tuning.framesPerSecond);

/**
 * One frame of sound: the chip plays the registers the program left last frame, through the
 * speaker's capacitor; then the
 * program takes the game's writes and works out the next ones. `counter` is the frame
 * counter the envelopes read ($4C84); in the demo the effects of voices 2 and 3 are silenced
 * ($01AD).
 */
export const soundFrame = (
  board: SoundBoard,
  writes: readonly SoundWrite[],
  counter: number,
  demo = false,
): SoundFrame => {
  const out = renderChip(board.chip, voicesOf(board), WAVEFORMS, SAMPLES_PER_FRAME, SAMPLE_RATE);
  const silenced = demo
    ? [...writes, { channel: 1, keep: 0, set: 0 }, { channel: 2, keep: 0, set: 0 }]
    : writes;
  const next = processChannels(
    { ...board, channels: applyWrites(board.channels, silenced) },
    counter,
  );
  const played = throughSpeaker(board.speaker, out.samples);
  return {
    board: { ...next, chip: out.chip, speaker: played.speaker },
    samples: Float32Array.from(played.samples, (sample) => sample * tuning.soundVolume),
  };
};
