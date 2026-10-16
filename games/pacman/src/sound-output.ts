/*
 * The speakers of the cabinet: the imperative shell that keeps the sound board between frames
 * and sends its samples to the browser.
 */
import type { AudioPlayer } from '@arcade/audio';
import { newSoundBoard, SAMPLE_RATE, soundFrame, type SoundWrite } from './sound-board';

/** Plays one frame of sound for the writes of that frame and the frame counter. */
export type SoundOutput = (writes: readonly SoundWrite[], counter: number) => void;

/** The sound output of the game, through `audio`. */
export const createSoundOutput = (audio: AudioPlayer): SoundOutput => {
  let board = newSoundBoard();
  return (writes, counter) => {
    const frame = soundFrame(board, writes, counter);
    board = frame.board;
    audio.stream(frame.samples, SAMPLE_RATE);
  };
};
