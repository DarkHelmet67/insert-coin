import { ghostNearby, ghostOnTile } from './collisions';
import { startEating, updateEating } from './eat-ghost';
import { tickFright } from './energizer';
import { updateEyes } from './eyes';
import type { PendingDecision } from './ghost-decisions';
import { updateElroy } from './ghost-modes';
import { updateGhost, type Decision } from './ghost-move';
import { GHOST, type Ghost, type GhostId } from './ghosts';
import { releaseByDots } from './house';
import { updatePacMan, type Joystick } from './pacman';
import { withGhost, type Playing } from './playing';
import { POINTS } from './score';
import { addPoints, eatFruit, eatTile } from './scoring';
import { tickDeath } from './death';
import { tuning } from './tuning.config';

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

/** The eaten ghost turns into eyes, so Pac-Man can no longer meet it ($1066). */
const makeEyes = (playing: Playing, id: GhostId): Playing => {
  const ghost = playing.ghosts[id];
  return ghost === undefined ? playing : withGhost(playing, { ...ghost, eyes: 'toDoor' });
};

/** The eyes of eaten ghosts on their way home ($1094-$10B4). */
const moveEyes = (work: FrameWork, ghost: Ghost): FrameWork => {
  const step = updateEyes(ghost, work.playing.video.colors);
  return queue({ ...work, playing: withGhost(work.playing, step.ghost) }, ghost, step.decision);
};

/** Pac-Man's move in one update ($1806); his last move remembers the dots eaten so far. */
const movePacMan = (playing: Playing, joystick: Joystick): Playing => {
  const move = updatePacMan(playing.pacman, joystick, playing.fright.active, playing.video.tiles);
  const moved = {
    ...playing,
    pacman: move.pacman,
    dotsAtLastMove: move.active ? playing.dotsEaten : playing.dotsAtLastMove,
  };
  return move.canEat ? eatTile(eatFruit(moved)) : moved;
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

/** The blue time and the house's releases ($1059-$1062). */
const tickTimers = (playing: Playing): Playing => {
  const fright = tickFright(playing.ghosts, playing.fright);
  const released = releaseByDots(fright.ghosts, playing.houseDots, playing.settings.houseDotLimits);
  return { ...playing, fright: fright.fright, ghosts: released.ghosts, houseDots: released.dots };
};

/**
 * Pac-Man meets a ghost ($1763): a blue one is eaten, for 200, 400, 800 then 1600 points;
 * any other catches him.
 */
const meet = (playing: Playing, id: GhostId): Playing => {
  if (!(playing.ghosts[id]?.blue ?? false)) return { ...playing, killer: id };
  const eaten = playing.fright.eaten + 1;
  return addPoints(
    { ...playing, eating: startEating(id), fright: { ...playing.fright, eaten } },
    POINTS.firstGhost + eaten - 1,
  );
};

/** The ghost Pac-Man meets in this update, by tile, or by pixels while energized ($171D, $1789). */
const collision = (playing: Playing): GhostId | undefined =>
  ghostOnTile(playing.pacman, playing.ghosts) ??
  (playing.fright.active ? ghostNearby(playing.pacman, playing.ghosts) : undefined);

/** Shows the points of the ghost being eaten, then lets it go as eyes ($1235). */
const continueEating = (playing: Playing): Playing => {
  if (playing.eating === undefined) return playing;
  const eating = updateEating(playing.eating, tuning.ghostPointsFrames);
  return eating === undefined
    ? makeEyes({ ...playing, eating: undefined }, playing.eating.ghost)
    : { ...playing, eating };
};

/**
 * One pass of the game's core ($1017): once a ghost has caught Pac-Man only his death goes
 * on; otherwise eyes first; then either the ghost being eaten, or the
 * collisions, Pac-Man, the four ghosts, the blue time and the house.
 */
export const updateCore = (work: FrameWork, joystick: Joystick): FrameWork => {
  const { playing } = work;
  if (playing.killer !== undefined) {
    return { ...work, playing: { ...playing, death: tickDeath(playing.death) } };
  }
  const eyes = work.playing.ghosts.reduce(moveEyes, work);
  if (eyes.playing.eating !== undefined) {
    return { ...eyes, playing: continueEating(eyes.playing) };
  }
  const met = collision(eyes.playing);
  if (met !== undefined) return { ...eyes, playing: meet(eyes.playing, met) };
  const afterPacMan = { ...eyes, playing: movePacMan(eyes.playing, joystick) };
  const moved = afterPacMan.playing.ghosts.reduce(moveGhost, afterPacMan);
  return { ...moved, playing: tickTimers(moved.playing) };
};
