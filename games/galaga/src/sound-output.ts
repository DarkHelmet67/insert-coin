/*
 * The speakers of the cabinet: the imperative shell that keeps the sound board between frames
 * and sends its samples, and the explosions, to the browser.
 */
import type { AudioPlayer } from '@arcade/audio';
import type { SoundCommands } from './sound-commands';
import { newSoundBoard, SAMPLE_RATE, soundFrame } from './sound-system';
import { tuning } from './tuning.config';

/** Plays one frame of sound for the commands of that frame. */
export type SoundOutput = (commands: SoundCommands) => void;

/** The sound output of the game, through `audio`. */
export const createSoundOutput = (audio: AudioPlayer): SoundOutput => {
  let board = newSoundBoard();
  return (commands) => {
    const frame = soundFrame(board, commands);
    board = frame.board;
    audio.stream(frame.samples, SAMPLE_RATE);
    if (commands.explosion) audio.play(tuning.explosion);
  };
};
