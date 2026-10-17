import { describe, expect, it } from 'vitest';
import { newSoundBoard, soundFrame, SOUND_CHANNEL, type SoundWrite } from './sound-board';

/** The board after `frames` frames, with `writes` in the first one. */
const run = (writes: readonly SoundWrite[], frames: number, demo = false) =>
  Array.from({ length: frames }).reduce(
    (board: ReturnType<typeof newSoundBoard>, _, frame) =>
      soundFrame(board, frame === 0 ? writes : [], frame, demo).board,
    newSoundBoard(),
  );

describe('the sound board', () => {
  it('is silent at power-on', () => {
    const frame = soundFrame(newSoundBoard(), [], 0);
    expect(frame.samples.every((sample) => sample === 0)).toBe(true);
    expect(frame.samples).toHaveLength(792);
  });

  it('plays the start music on voices 1 and 2', () => {
    const board = run(
      [
        { channel: SOUND_CHANNEL.song1, keep: 0, set: 1 },
        { channel: SOUND_CHANNEL.song2, keep: 0, set: 1 },
      ],
      2,
    );
    expect(board.registers[0]?.volume).toBeGreaterThan(0);
    expect(board.registers[1]?.volume).toBe(15);
    const samples = soundFrame(board, [], 2).samples;
    expect(samples.some((sample) => sample !== 0)).toBe(true);
  });

  it('keeps the bits a write does not touch', () => {
    const board = run(
      [
        { channel: SOUND_CHANNEL.effect2, keep: 0, set: 0x21 },
        { channel: SOUND_CHANNEL.effect2, keep: 0xe0, set: 0x02 },
      ],
      1,
    );
    expect(board.channels[1]?.triggers).toBe(0x22);
  });

  it('silences voices 2 and 3 in the demo', () => {
    const board = run([{ channel: SOUND_CHANNEL.effect2, keep: 0, set: 1 }], 3, true);
    expect(board.registers[1]?.volume).toBe(0);
  });
});
