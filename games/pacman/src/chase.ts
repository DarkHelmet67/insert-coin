import { reversePacMan } from './autopilot';
import { corridorGhost, corridorPacMan, corridorWalls } from './corridor';
import { paintEyes } from './energizer';
import { runCore, runFrameDecisions, tickBlink, tickPoints, tickWave } from './frame';
import { directionStep, oppositeDirection } from './geometry';
import { GHOST, GHOST_IDS, type Ghost, type GhostId } from './ghosts';
import { NEW_HOUSE_DOTS } from './house-dots';
import { TILE } from './maze';
import { NO_JOYSTICK } from './pacman';
import { newLife, withGhost, type Playing } from './playing';
import { writeVideo } from './video';

/**
 * The chase of the attract mode (states 30-34 of $4E02): Pac-Man runs left along an empty
 * row with the four ghosts after him, eats an energizer, turns back and eats them all. The
 * program drives Pac-Man as in the demo and runs the game's own core, without the blue time
 * running out and without the house.
 */

/** The chase uses the settings of row $14 of the difficulty table: those of level 21 ($04EE). */
const CHASE_LEVEL = 21;

/** The energizer at the end of the row ($0501). */
export const CHASE_ENERGIZER = 0x332;
/** The energizer of "50 PTS", which blinks with it ($0C33). */
const POINTS_ENERGIZER = 0x278;

/**
 * The game set up for the chase ($04E5-$0506): one life, none shown, the actors at the right
 * edge of the row, the energizer and the walls of the row.
 */
export const chasePlaying = (playing: Playing): Playing => {
  const life = newLife(CHASE_LEVEL);
  return {
    ...playing,
    ...life,
    demo: true,
    level: 1,
    houseDots: NEW_HOUSE_DOTS,
    dotsEaten: 0,
    lives: 1,
    livesShown: 0,
    extraLife: false,
    fruitsReleased: [false, false],
    fruitTimer: undefined,
    fruitTextTimer: undefined,
    pacman: corridorPacMan(life.pacman),
    ghosts: life.ghosts.map((ghost) => ({ ...corridorGhost(ghost), house: 'home' })),
    video: writeVideo(playing.video, {
      tiles: [{ address: CHASE_ENERGIZER, value: TILE.energizer }, ...corridorWalls()],
    }),
  };
};

/**
 * When each ghost comes out ($051C-$0569): Blinky when Pac-Man reaches column $21, then the
 * others as Blinky reaches columns $20, $22 and $24.
 */
const RELEASES: readonly { readonly ghost: GhostId; readonly column: (p: Playing) => boolean }[] = [
  { ghost: GHOST.blinky, column: (p) => p.pacman.tile.x === 0x21 },
  { ghost: GHOST.pinky, column: (p) => p.ghosts[GHOST.blinky]?.tile.x === 0x20 },
  { ghost: GHOST.inky, column: (p) => p.ghosts[GHOST.blinky]?.tile.x === 0x22 },
  { ghost: GHOST.clyde, column: (p) => p.ghosts[GHOST.blinky]?.tile.x === 0x24 },
];

/** All four ghosts are out: the chase goes on until they are eaten. */
export const ALL_RELEASED = GHOST_IDS.length;

/**
 * The ghosts turn around when the energizer is eaten (routines $1EFE-$1F73): from the next
 * tile, or at once in the last state of the chase ($1F17).
 */
const turnGhost = (ghost: Ghost, now: boolean): Ghost => {
  if (!ghost.reverse) return ghost;
  const back = oppositeDirection(ghost.orientation);
  const step = directionStep(back);
  const turned = { ...ghost, reverse: false, nextOrientation: back, nextStep: step };
  return now ? { ...turned, orientation: back, step } : turned;
};

/** The blinking energizers of the attract mode. */
const ATTRACT_ENERGIZERS = [CHASE_ENERGIZER, POINTS_ENERGIZER] as const;

/** One frame of the chase ($052C-$0547). */
const chaseFrame = (playing: Playing, released: number): Playing => {
  const work = runCore(playing, NO_JOYSTICK, false);
  const energized = !playing.fright.active && work.playing.fright.active;
  const moved = tickBlink(tickWave(work.playing), ATTRACT_ENERGIZERS);
  const turned = {
    ...moved,
    ghosts: paintEyes(moved.ghosts).map((ghost) => turnGhost(ghost, released === ALL_RELEASED)),
    pacman: energized ? reversePacMan(moved.pacman) : moved.pacman,
  };
  return tickPoints(runFrameDecisions(turned, work));
};

/** The chase after one frame: `released` ghosts are out; `over` once all four are eaten. */
export interface ChaseFrame {
  readonly playing: Playing;
  readonly released: number;
  readonly over: boolean;
}

/**
 * One state of the chase: release the next ghost when its moment comes, or move everyone; at
 * the end, wait for the last ghost's points to go ($056C).
 */
export const updateChase = (playing: Playing, released: number): ChaseFrame => {
  const next = RELEASES[released];
  if (next !== undefined) {
    if (!next.column(playing)) {
      return { playing: chaseFrame(playing, released), released, over: false };
    }
    const ghost = playing.ghosts[next.ghost];
    const out = ghost === undefined ? playing : withGhost(playing, { ...ghost, house: 'out' });
    return { playing: out, released: released + 1, over: false };
  }
  const over = playing.fright.eaten === ALL_RELEASED && playing.eating?.phase === 'done';
  return over
    ? { playing, released, over }
    : { playing: chaseFrame(playing, released), released, over };
};
