import { describe, expect, it } from 'vitest';
import {
  newIntermission,
  sceneAfter,
  updateIntermission,
  type Intermission,
  type Scene,
} from './intermission';
import { intermissionPlaying } from './intermission-moves';
import { intermissionSprites } from './intermission-sprites';
import { GHOST } from './ghosts';
import { newPlaying, type Playing } from './playing';
import { blankVideo } from './screen';

/** What an intermission went through: each step's first frame, and how it ended. */
interface Run {
  readonly playing: Playing;
  readonly last: Intermission;
  readonly steps: readonly { step: number; playing: Playing; intermission: Intermission }[];
  readonly frames: number;
  readonly pause: boolean;
}

/** Plays a scene to its end. */
const play = (scene: Scene): Run => {
  const level = newPlaying(0);
  let playing = intermissionPlaying({ ...level, video: blankVideo(level.video) });
  let intermission = newIntermission(scene);
  const steps: { step: number; playing: Playing; intermission: Intermission }[] = [];
  for (let frame = 1; frame < 3000; frame += 1) {
    const next = updateIntermission(playing, intermission, frame);
    if (next.intermission === undefined) {
      return { playing: next.playing, last: intermission, steps, frames: frame, pause: next.pause };
    }
    if (next.intermission.step !== intermission.step) {
      steps.push({
        step: next.intermission.step,
        playing: next.playing,
        intermission: next.intermission,
      });
    }
    playing = next.playing;
    intermission = next.intermission;
  }
  throw new Error(`scene ${scene} never ends`);
};

describe('the intermissions', () => {
  it('come after levels 2, 5, 9, 13 and 17', () => {
    expect([1, 4, 8, 12, 16].map(sceneAfter)).toEqual([1, 2, 3, 3, 3]);
    expect([0, 2, 3, 5, 20, 255].map(sceneAfter)).toEqual(Array(6).fill(undefined));
  });

  it('first: a blue Blinky runs from a giant Pac-Man', () => {
    const run = play(1);
    expect(run.pause).toBe(true);
    expect(run.frames).toBeGreaterThan(400);
    const giant = run.steps.find((entry) => entry.step === 5);
    expect(giant?.playing.ghosts[GHOST.blinky]?.blue).toBe(true);
    const sprites =
      giant === undefined ? [] : intermissionSprites(giant.playing, giant.intermission);
    expect(sprites.filter((sprite) => sprite.palette === 0x16)).toHaveLength(4);
    expect(sprites[4]?.code).toBe(0x3f);
  });

  it('second: Blinky is caught by the nail and his sheet tears', () => {
    const run = play(2);
    expect(run.pause).toBe(false);
    expect(run.playing.ghosts[GHOST.blinky]?.position.x).toBe(0x82);
    expect(run.playing.video.tiles[0x1d2]).toBe(0x6c);
    expect(run.last.pacmanHidden).toBe(true);
    const torn = intermissionSprites(run.playing, run.last);
    expect(torn[GHOST.blinky]?.code).toBe(0x33);
    expect(torn[4]?.palette).toBe(0);
  });

  it('third: Blinky comes back naked, dragging his sheet', () => {
    const run = play(3);
    expect(run.pause).toBe(true);
    const sprites = intermissionSprites(run.playing, run.last);
    expect(sprites).toHaveLength(6);
    expect(sprites[5]?.palette).toBe(0x1e);
    expect(sprites[GHOST.blinky]?.code).toBe((sprites[5]?.code ?? 0) + 2);
  });
});
