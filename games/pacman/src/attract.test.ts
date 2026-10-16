import { describe, expect, it } from 'vitest';
import { INTRO_STEPS, introVideo, pictureWrites } from './attract';
import { noControls } from './controls';
import { createGame, updateGame, type GameState } from './game';
import { ROM_TEXTS } from './rom/texts';
import { filledVideo } from './video';

/** The machine after `frames` frames without input. */
const run = (state: GameState, frames: number): GameState =>
  Array.from({ length: frames }).reduce<GameState>(
    (current) => updateGame(current, noControls),
    state,
  );

/** Whether message `text` is on the screen. */
const shows = (state: GameState, text: number): boolean => {
  const first = ROM_TEXTS[text];
  return first !== undefined && state.playing.video.tiles[first.offset] === first.tiles[0];
};

describe('the introduction of the ghosts', () => {
  it('has the 15 steps of the program, a second or half a second each', () => {
    expect(INTRO_STEPS).toHaveLength(15);
    expect(INTRO_STEPS.every((step) => step.wait === 0x4a || step.wait === 0x45)).toBe(true);
  });

  it('draws a picture as 2 rows of 3 tiles in the ghost color', () => {
    const writes = pictureWrites({ address: 0x304, color: 1 });
    expect(writes.tiles?.map((cell) => cell.value)).toEqual([0xb1, 0xb3, 0xb5, 0xb0, 0xb2, 0xb4]);
    expect(writes.colors?.every((cell) => cell.value === 1)).toBe(true);
  });

  it('starts at power-on with "CHARACTER / NICKNAME"', () => {
    const start = createGame(0);
    expect(start.stage.kind).toBe('intro');
    expect(start.playing.demo).toBe(true);
    expect(shows(start, 12)).toBe(true);
    const [first] = INTRO_STEPS;
    const heading = ROM_TEXTS[12];
    if (first === undefined || heading === undefined) throw new Error('missing data');
    expect(introVideo(filledVideo(0x40, 0), first).tiles[heading.offset]).toBe(0x43);
  });

  it('shows Blinky after a second, his nickname and then his name', () => {
    const blinky = run(createGame(0), 60);
    expect(blinky.playing.video.tiles[0x304]).toBe(0xb1);
    expect(shows(run(blinky, 60), 20)).toBe(true);
    expect(shows(run(blinky, 60), 13)).toBe(false);
    expect(shows(run(blinky, 90), 13)).toBe(true);
  });

  it('moves on to the chase after the copyright', () => {
    const chase = run(createGame(0), 690);
    expect(chase.stage.kind).toBe('chase');
    expect(shows(chase, 19)).toBe(true);
  });
});
