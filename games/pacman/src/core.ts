import { updateEyes } from './eyes';
import type { PendingDecision } from './ghost-decisions';
import { updateElroy } from './ghost-modes';
import { updateGhost, type Decision } from './ghost-move';
import { GHOST, type Ghost } from './ghosts';
import { releaseByDots } from './house';
import { updatePacMan, type Joystick } from './pacman';
import { withGhost, type Playing } from './playing';
import { eatTile } from './scoring';

/** The game and the decisions the ghosts asked for so far in this frame. */
export interface FrameWork {
  readonly playing: Playing;
  readonly pending: readonly PendingDecision[];
}

/** The work with a ghost's decision queued, if it asked for one. */
const queue = (work: FrameWork, ghost: Ghost, decision: Decision | undefined): FrameWork =>
  decision === undefined
    ? work
    : { ...work, pending: [...work.pending, { id: ghost.id, decision }] };

/** The eyes of eaten ghosts on their way home ($1094-$10B4). */
const moveEyes = (work: FrameWork, ghost: Ghost): FrameWork => {
  const step = updateEyes(ghost, work.playing.video.colors);
  return queue({ ...work, playing: withGhost(work.playing, step.ghost) }, ghost, step.decision);
};

/** Pac-Man's move in one update ($1806); his last move remembers the dots eaten so far. */
const movePacMan = (playing: Playing, joystick: Joystick): Playing => {
  const move = updatePacMan(playing.pacman, joystick, false, playing.video.tiles);
  const moved = {
    ...playing,
    pacman: move.pacman,
    dotsAtLastMove: move.active ? playing.dotsEaten : playing.dotsAtLastMove,
  };
  return move.canEat ? eatTile(moved) : moved;
};

/** One ghost's move in one update; Blinky checks Cruise Elroy first ($1B40). */
const moveGhost = (work: FrameWork, ghost: Ghost): FrameWork => {
  const { playing } = work;
  const clydeOut = playing.ghosts[GHOST.clyde]?.house !== 'home';
  const roams = ghost.house === 'out' && ghost.eyes === 'alive';
  const elroy =
    ghost.id === GHOST.blinky && roams
      ? updateElroy(playing.elroy, playing.dotsEaten, playing.settings.elroyDots, clydeOut)
      : playing.elroy;
  const move = updateGhost(ghost, playing.video.colors, elroy, playing.elroySpeeds);
  return queue(
    {
      ...work,
      playing: { ...withGhost(playing, move.ghost), elroy, elroySpeeds: move.elroySpeeds },
    },
    ghost,
    move.decision,
  );
};

/** The house lets out the ghosts whose dot counters are full ($2069-$20AF). */
const releaseGhosts = (playing: Playing): Playing => {
  const released = releaseByDots(
    playing.ghosts,
    playing.houseDots,
    playing.settings.houseDotLimits,
  );
  return { ...playing, ghosts: released.ghosts, houseDots: released.dots };
};

/** One pass of the game's core ($1017): eyes, Pac-Man, the four ghosts, the house. */
export const updateCore = (work: FrameWork, joystick: Joystick): FrameWork => {
  const eyes = work.playing.ghosts.reduce(moveEyes, work);
  const afterPacMan = { ...eyes, playing: movePacMan(eyes.playing, joystick) };
  const moved = afterPacMan.playing.ghosts.reduce(moveGhost, afterPacMan);
  return { ...moved, playing: releaseGhosts(moved.playing) };
};
