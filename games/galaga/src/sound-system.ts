/*
 * The sound board of the cabinet: the sound program drives the three voices of the WSG chip,
 * two ticks every frame, and the chip turns them into samples for the speakers.
 */
import { decodeWaveforms, newChip, renderChip, type WsgChip } from '@arcade/wsg';
import { WAVEFORM_PROM } from './rom/sound-rom';
import type { SoundCommands } from './sound-commands';
import { tickSound } from './sound-program';
import { newSoundState, type SoundState } from './sound-state';
import { tuning } from './tuning.config';

/** Samples a second sent to the browser: half the chip's rate. */
export const SAMPLE_RATE = 48000;

/** The sound processor ticks twice a frame, at lines 64 and 192 of the screen (MAME). */
const TICKS_PER_FRAME = 2;
const SAMPLES_PER_TICK = SAMPLE_RATE / 60 / TICKS_PER_FRAME;

const WAVEFORMS = decodeWaveforms(WAVEFORM_PROM);

/** The sound board between two frames. */
export interface SoundBoard {
  readonly sound: SoundState;
  readonly chip: WsgChip;
}

/** The board at power-on. */
export const newSoundBoard = (): SoundBoard => ({ sound: newSoundState(), chip: newChip() });

/** The sound of one frame, and the board after it. */
export interface SoundFrame {
  readonly board: SoundBoard;
  readonly samples: Float32Array<ArrayBuffer>;
}

/** The trigger registers after the main processor's writes. */
const applyWrites = (sound: SoundState, commands: SoundCommands): SoundState => ({
  ...sound,
  triggers: commands.writes.reduce(
    (triggers, [effect, value]) => triggers.map((v, i) => (i === effect ? value : v)),
    sound.triggers,
  ),
});

/** One frame of the sound board. */
export const soundFrame = (board: SoundBoard, commands: SoundCommands): SoundFrame => {
  const start = { board: { ...board, sound: applyWrites(board.sound, commands) }, chunks: [] };
  const { board: next, chunks } = Array.from({ length: TICKS_PER_FRAME }).reduce<{
    readonly board: SoundBoard;
    readonly chunks: readonly Float32Array[];
  }>(({ board: current, chunks: done }) => {
    const tick = tickSound(current.sound, commands.sign);
    const out = renderChip(current.chip, tick.voices, WAVEFORMS, SAMPLES_PER_TICK, SAMPLE_RATE);
    return { board: { sound: tick.sound, chip: out.chip }, chunks: [...done, out.samples] };
  }, start);
  return {
    board: next,
    samples: Float32Array.from(
      chunks.flatMap((chunk) => [...chunk].map((s) => s * tuning.soundVolume)),
    ),
  };
};
