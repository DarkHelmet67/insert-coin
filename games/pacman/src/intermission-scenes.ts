import { turnPacManNow } from './autopilot';
import { startFright } from './energizer';
import { directionStep, oppositeDirection, toByte } from './geometry';
import { moveActors, releaseBlinky } from './intermission-moves';
import {
  blinkyOf,
  blinkyTileX,
  blinkyX,
  pacTileX,
  until,
  wait,
  type SceneFrame,
  type Step,
} from './scene-steps';
import { withGhost, type Playing } from './playing';
import { SOUND, withSounds } from './sounds';
import { DELAY } from './timers';
import { writeVideo, type CellWrite } from './video';

/**
 * The three intermissions, step by step, as the tables at $210B, $21A5 and $229A run them:
 * each step either does what it waits for and moves on, or moves the actors one more frame.
 * A step that starts a timer moves on to a step that only waits for it.
 */

/** The blue Blinky turns back, and Pac-Man with him at once ($2153-$2169). */
const turnTables = (playing: Playing): SceneFrame => {
  const fright = startFright(playing.ghosts, playing.settings.frightTime);
  return {
    playing: withSounds(
      { ...playing, ...fright, pacman: turnPacManNow(playing.pacman) },
      SOUND.quiet,
    ),
    advance: true,
    timer: DELAY.halfSecond,
  };
};

/** The first intermission ($2108): Blinky chases Pac-Man, then a giant Pac-Man chases him. */
const SCENE_1: readonly Step[] = [
  until(
    (p) => pacTileX(p) === 0x21,
    'both',
    (p) => ({ playing: releaseBlinky(p, true), advance: true }),
  ),
  until((p) => pacTileX(p) === 0x1e, 'both'),
  until((p) => blinkyTileX(p) === 0x1e, 'blinky', turnTables),
  wait,
  until((p) => blinkyTileX(p) === 0x2f, 'blinky'),
  until((p) => blinkyTileX(p) === 0x3d, 'both'),
  until(
    (p) => pacTileX(p) === 0x3d,
    'pacman',
    (p) => ({ playing: p, done: true }),
  ),
];

/** The nail of the second intermission: 2 × 2 tiles from $1D2 ($21A1). */
const NAIL = [0x1d2, 0x1d3, 0x1f2, 0x1f3] as const;

/** The nail's tiles, as many as given, from its top left. */
const nail = (playing: Playing, tiles: readonly number[]): Playing => ({
  ...playing,
  video: writeVideo(playing.video, {
    tiles: tiles.map((value, i): CellWrite => ({ address: NAIL[i] ?? NAIL[0], value })),
  }),
});

/** A step of the tearing sheet: once Blinky reaches `x`, the nail shows `tiles`. */
const tear = (x: number, tiles: readonly number[]): Step =>
  until(
    (p) => blinkyX(p) === x,
    'slowBlinky',
    (p) => ({ playing: nail(p, tiles), advance: true }),
  );

/** Blinky slows down to a crawl as his sheet catches (Elroy 2 speed $2084 2084, $2201). */
const SNAGGED = 0x20842084;

/** The second intermission ($219E): Blinky's sheet catches on a nail and tears. */
const SCENE_2: readonly Step[] = [
  (p) => ({
    playing: nail(
      {
        ...p,
        video: writeVideo(p.video, { colors: NAIL.map((address) => ({ address, value: 1 })) }),
      },
      [0x60, 0x61],
    ),
    advance: true,
    timer: 0x43,
  }),
  wait,
  until(
    (p) => pacTileX(p) === 0x2c,
    'both',
    (p) => ({ playing: releaseBlinky(p, true), advance: true }),
  ),
  until(
    (p) => blinkyX(p) === 0x77 || blinkyX(p) === 0x78,
    'both',
    (p) => ({
      playing: { ...p, elroySpeeds: { ...p.elroySpeeds, elroy2: SNAGGED } },
      advance: true,
    }),
  ),
  tear(0x78, [0x62, 0x63]),
  tear(0x7b, [0x64, 0x65, 0x66, 0x67]),
  tear(0x7e, [0x68, 0x69, 0x6a, 0x6b]),
  until(
    (p) => blinkyX(p) === 0x80,
    'slowBlinky',
    (p) => ({ playing: p, advance: true, timer: 0x4f }),
  ),
  wait,
  (p) => {
    const blinky = blinkyOf(p);
    const pulled = withGhost(p, {
      ...blinky,
      position: { ...blinky.position, x: toByte(blinky.position.x + 2) },
    });
    return { playing: nail(pulled, [0x6c, 0x6d, 0x40, 0x40]), advance: true, timer: DELAY.second };
  },
  wait,
  (p) => ({ playing: p, advance: true, timer: DELAY.pause }),
  wait,
  (p) => ({ playing: p, done: true }),
];

/** Blinky will turn back at the middle of his next tile ($22CF-$22D4, routine $1EFE). */
const turnBlinky = (playing: Playing): Playing => {
  const blinky = blinkyOf(playing);
  const back = oppositeDirection(blinky.orientation);
  return withGhost(playing, {
    ...blinky,
    position: { ...blinky.position, x: toByte(blinky.position.x + 2) },
    nextOrientation: back,
    nextStep: directionStep(back),
  });
};

/** Blinky drags his sheet behind him, 8 pixels to his left on the screen ($22E4). */
const dragSheet =
  (ready: (playing: Playing) => boolean): Step =>
  (p) => {
    if (ready(p)) return { playing: p, advance: true };
    const blinky = blinkyOf(p);
    const sheet = { x: toByte(blinky.position.x - 8), y: blinky.position.y };
    return { playing: moveActors(p, 'both'), sheet };
  };

/** The third intermission ($2297): Blinky, mended, chases Pac-Man and comes back naked. */
const SCENE_3: readonly Step[] = [
  until(
    (p) => pacTileX(p) === 0x25,
    'both',
    (p) => ({ playing: releaseBlinky(p, true), advance: true }),
  ),
  until(
    (p) => blinkyX(p) === 0xff || blinkyX(p) === 0xfe,
    'both',
    (p) => ({ playing: turnBlinky(p), advance: true, timer: DELAY.second }),
  ),
  wait,
  dragSheet((p) => blinkyTileX(p) === 0x2d),
  dragSheet((p) => blinkyTileX(p) === 0x1e),
  (p) => ({ playing: p, done: true }),
];

/** An intermission: 1, 2 or 3. */
export type Scene = 1 | 2 | 3;

/** The steps of each scene. */
export const SCENES: Readonly<Record<Scene, readonly Step[]>> = {
  1: SCENE_1,
  2: SCENE_2,
  3: SCENE_3,
};

/** Whether the scene shows its end with half a second of pause before the next level. */
export const pausesAfter = (scene: Scene): boolean => scene !== 2;
