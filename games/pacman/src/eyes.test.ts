import { describe, expect, it } from 'vitest';
import { DIRECTION, directionStep } from './geometry';
import { updateEyes } from './eyes';
import { GHOST, newGhost, type Ghost } from './ghosts';
import { levelSettings } from './levels';
import { mazeColorWrites } from './maze';
import { filledVideo, writeVideo } from './video';

const colors = writeVideo(filledVideo(0x40, 0), { colors: mazeColorWrites(false, true) }).colors;
const speeds = levelSettings(1).speeds;

/** The ghost after `count` updates. */
const run = (ghost: Ghost, count: number): Ghost =>
  Array.from({ length: count }).reduce<Ghost>(
    (current) => updateEyes(current, colors).ghost,
    ghost,
  );

describe('updateEyes', () => {
  it('leaves living ghosts alone', () => {
    const blinky = newGhost(GHOST.blinky, speeds);
    expect(run(blinky, 5)).toEqual(blinky);
  });

  it('stops the eyes exactly above the door, then takes them down into the house', () => {
    const eyes: Ghost = {
      ...newGhost(GHOST.inky, speeds),
      house: 'out',
      eyes: 'toDoor',
      blue: true,
      position: { x: 0x78, y: 0x64 },
      step: directionStep(DIRECTION.left),
      nextStep: directionStep(DIRECTION.left),
      orientation: DIRECTION.left,
      nextOrientation: DIRECTION.left,
    };
    const above = run(eyes, 8);
    expect(above.position).toEqual({ x: 0x80, y: 0x64 });
    expect(above.eyes).toBe('down');
    const floor = run(above, 0x1c);
    expect(floor.position.y).toBe(0x80);
    expect(floor.eyes).toBe('sideways');
    const home = run(floor, 0x10);
    expect(home.position.x).toBe(0x90);
    expect(home).toMatchObject({ eyes: 'alive', house: 'home', blue: false });
  });
});
