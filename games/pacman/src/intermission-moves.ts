import { updateAutoPacMan } from './autopilot';
import { newFrameWork, queue, type FrameWork } from './core';
import { corridorGhost, corridorPacMan, corridorWalls } from './corridor';
import { runFrameDecisions, tickWave } from './frame';
import { GHOST } from './ghosts';
import { updateGhost } from './ghost-move';
import { newLife, withGhost, type Playing } from './playing';
import { writeVideo } from './video';

/**
 * The actors of the intermissions. The program sets them up after the flashes of every level
 * ($0A0E), as for the attract mode's chase, and moves them by calling the routines of Pac-Man
 * ($1806) and Blinky ($1B36) directly: no collisions, no house, no blue time going by.
 */

/** The intermissions use the settings of row $13 of the difficulty table: those of level 20. */
const INTERMISSION_LEVEL = 20;

/** The game ready for an intermission: everyone in the corridor's row, waiting off screen. */
export const intermissionPlaying = (playing: Playing): Playing => {
  const life = newLife(INTERMISSION_LEVEL);
  return {
    ...playing,
    ...life,
    pacman: corridorPacMan(life.pacman),
    ghosts: life.ghosts.map((ghost) => ({ ...corridorGhost(ghost), house: 'home' })),
  };
};

/**
 * Blinky comes out, as Cruise Elroy 2, the fastest he can go (4DA0 and 4DB7 set), and with
 * `walls` the corridor is drawn ($0506).
 */
export const releaseBlinky = (playing: Playing, walls: boolean): Playing => {
  const blinky = playing.ghosts[GHOST.blinky];
  const released = blinky === undefined ? playing : withGhost(playing, { ...blinky, house: 'out' });
  return {
    ...released,
    elroy: { elroy1: false, elroy2: true },
    video: walls ? writeVideo(released.video, { tiles: corridorWalls() }) : released.video,
  };
};

/** One update of Pac-Man, driven by the program. */
const pacmanPass = (work: FrameWork): FrameWork => {
  const move = updateAutoPacMan(work.playing.pacman, work.playing.fright.active);
  return {
    ...work,
    playing: { ...work.playing, pacman: move.pacman },
    pacmanDecides: work.pacmanDecides || move.decides,
  };
};

/** One update of Blinky. */
const blinkyPass = (work: FrameWork): FrameWork => {
  const { playing } = work;
  const blinky = playing.ghosts[GHOST.blinky];
  if (blinky === undefined) return work;
  const move = updateGhost(blinky, playing.video.colors, playing.elroy, playing.elroySpeeds);
  return queue(
    { ...work, playing: { ...withGhost(playing, move.ghost), elroySpeeds: move.elroySpeeds } },
    move.ghost,
    move.decision,
  );
};

/**
 * Who moves in a frame: both of them ($2130), Blinky alone ($2136), Pac-Man alone ($2186), or
 * both with Blinky at half the updates ($2237). The skirts wave whenever Blinky moves.
 */
export type Movers = 'both' | 'blinky' | 'pacman' | 'slowBlinky';

/** The updates of each kind of frame, in the program's order. */
const PASSES: Readonly<Record<Movers, readonly ((work: FrameWork) => FrameWork)[]>> = {
  both: [pacmanPass, pacmanPass, blinkyPass, blinkyPass],
  blinky: [blinkyPass, blinkyPass],
  pacman: [pacmanPass, pacmanPass],
  slowBlinky: [pacmanPass, pacmanPass, blinkyPass],
};

/** One frame of movement, then the decisions the actors asked for. */
export const moveActors = (playing: Playing, movers: Movers): Playing => {
  const work = PASSES[movers].reduce((current, pass) => pass(current), newFrameWork(playing));
  const waved = movers === 'pacman' ? work.playing : tickWave(work.playing);
  return runFrameDecisions(waved, work);
};
