import { mealOn } from './eating';
import { tileAddress } from './geometry';
import { runDecisions, type PendingDecision } from './ghost-decisions';
import {
  isScatter,
  NEW_MODE_CLOCK,
  NO_ELROY,
  tickModes,
  updateElroy,
  type ModeClock,
} from './ghost-modes';
import { updateGhost, type ElroySpeeds, type ElroyState } from './ghost-move';
import { GHOST, GHOST_IDS, newGhost, type Ghost } from './ghosts';
import { levelSettings, type LevelSettings } from './levels';
import { newMazeWrites, TILE } from './maze';
import { newPacMan, updatePacMan, type Joystick, type PacMan } from './pacman';
import { HIGH_SCORE_ADDRESS, pointsOf, SCORE_ADDRESS, scoreWrites } from './score';
import { TEXT, textWrites } from './texts';
import { filledVideo, writeVideo, type Video } from './video';

/** A game in progress. */
export interface Playing {
  /** The level, from 1. */
  readonly level: number;
  readonly settings: LevelSettings;
  /** The screen's tiles and colors: the maze with its dots is part of the state, like on the cabinet. */
  readonly video: Video;
  readonly pacman: PacMan;
  readonly ghosts: readonly Ghost[];
  readonly elroySpeeds: ElroySpeeds;
  readonly elroy: ElroyState;
  readonly modes: ModeClock;
  /** The ghosts' skirts: the bit ($4DC0) and the frames counted to flip it ($4DC4). */
  readonly wave: number;
  readonly waveFrames: number;
  /** The random pointer of the blue ghosts ($4DC9). */
  readonly seed: number;
  /** Dots and energizers eaten in this level ($4E0E). */
  readonly dotsEaten: number;
  readonly score: number;
  readonly hiScore: number;
}

/** "1UP" over the score: tiles '1', 'U', 'P' from right to left at $3DA-$3D8 (routine $0369). */
const ONE_UP = [
  { address: 0x3da, value: 0x31 },
  { address: 0x3d9, value: 0x55 },
  { address: 0x3d8, value: 0x50 },
];

/** The screen of a new game: maze, dots, scores. */
const newGameVideo = (hiScore: number): Video =>
  writeVideo(
    writeVideo(writeVideo(filledVideo(TILE.space, 0), newMazeWrites()), textWrites(TEXT.highScore)),
    {
      tiles: [
        ...ONE_UP,
        ...scoreWrites(0, SCORE_ADDRESS),
        ...(hiScore > 0 ? scoreWrites(hiScore, HIGH_SCORE_ADDRESS) : []),
      ],
    },
  );

/** A new game at level 1. */
export const newPlaying = (hiScore: number): Playing => {
  const settings = levelSettings(1);
  const { speeds } = settings;
  return {
    level: 1,
    settings,
    video: newGameVideo(hiScore),
    pacman: newPacMan(speeds.pacman, speeds.pacmanFright),
    ghosts: GHOST_IDS.map((id) => newGhost(id, speeds)),
    elroySpeeds: { elroy1: speeds.elroy1, elroy2: speeds.elroy2 },
    elroy: NO_ELROY,
    modes: NEW_MODE_CLOCK,
    wave: 0,
    waveFrames: 0,
    seed: 0,
    dotsEaten: 0,
    score: 0,
    hiScore,
  };
};

/** Adds points to the score and shows it, with the high score when it is beaten ($2A5A). */
const addPoints = (playing: Playing, entry: number): Playing => {
  const score = playing.score + pointsOf(entry);
  const hiScore = Math.max(score, playing.hiScore);
  return {
    ...playing,
    score,
    hiScore,
    video: writeVideo(playing.video, {
      tiles: [
        ...scoreWrites(score, SCORE_ADDRESS),
        ...(hiScore > playing.hiScore ? scoreWrites(hiScore, HIGH_SCORE_ADDRESS) : []),
      ],
    }),
  };
};

/** Pac-Man eats what is on his tile, if anything ($19CD). */
const eat = (playing: Playing): Playing => {
  const address = tileAddress(playing.pacman.tile);
  const meal = mealOn(playing.video.tiles[address] ?? TILE.space);
  if (meal === undefined) return playing;
  return addPoints(
    {
      ...playing,
      video: writeVideo(playing.video, { tiles: [{ address, value: TILE.space }] }),
      dotsEaten: playing.dotsEaten + 1,
      pacman: { ...playing.pacman, pause: meal.pause },
    },
    meal.points,
  );
};

/** Pac-Man's move in one update ($1806). */
const movePacMan = (playing: Playing, joystick: Joystick): Playing => {
  const move = updatePacMan(playing.pacman, joystick, false, playing.video.tiles);
  const moved = { ...playing, pacman: move.pacman };
  return move.canEat ? eat(moved) : moved;
};

/** The game and the decisions the ghosts asked for so far in this frame. */
interface FrameWork {
  readonly playing: Playing;
  readonly pending: readonly PendingDecision[];
}

/** One ghost's move in one update; Blinky checks Cruise Elroy first ($1B40). */
const moveGhost = (work: FrameWork, ghost: Ghost): FrameWork => {
  const { playing } = work;
  const clydeOut = playing.ghosts[GHOST.clyde]?.out ?? false;
  const elroy =
    ghost.id === GHOST.blinky && ghost.out
      ? updateElroy(playing.elroy, playing.dotsEaten, playing.settings.elroyDots, clydeOut)
      : playing.elroy;
  const move = updateGhost(ghost, playing.video.colors, elroy, playing.elroySpeeds);
  return {
    playing: {
      ...playing,
      elroy,
      elroySpeeds: move.elroySpeeds,
      ghosts: playing.ghosts.map((other) => (other.id === ghost.id ? move.ghost : other)),
    },
    pending:
      move.decision === undefined
        ? work.pending
        : [...work.pending, { id: ghost.id, decision: move.decision }],
  };
};

/** One pass of the game's core ($1017): Pac-Man, then the four ghosts. */
const updateCore = (work: FrameWork, joystick: Joystick): FrameWork => {
  const afterPacMan = { ...work, playing: movePacMan(work.playing, joystick) };
  return afterPacMan.playing.ghosts.reduce(moveGhost, afterPacMan);
};

/** The skirts flip every 8 frames (routine $0E23). */
const tickWave = (playing: Playing): Playing => {
  const frames = playing.waveFrames + 1;
  return frames === 8
    ? { ...playing, waveFrames: 0, wave: playing.wave ^ 1 }
    : { ...playing, waveFrames: frames };
};

/** The scatter/chase clock; at each change all the ghosts must turn around ($0E36). */
const tickClock = (playing: Playing): Playing => {
  const tick = tickModes(playing.modes, playing.settings.modeChanges, false);
  return {
    ...playing,
    modes: tick.clock,
    ghosts: tick.reverse
      ? playing.ghosts.map((ghost) => ({ ...ghost, reverse: true }))
      : playing.ghosts,
  };
};

/**
 * One frame of play: the core runs twice (so the fastest actors move 2 pixels), then the
 * clocks, then the decisions the ghosts asked for.
 */
export const updatePlaying = (playing: Playing, joystick: Joystick): Playing => {
  const work = updateCore(updateCore({ playing, pending: [] }, joystick), joystick);
  const clocked = tickClock(tickWave(work.playing));
  const decided = runDecisions(clocked.ghosts, clocked.seed, work.pending, {
    hunt: {
      pacmanTile: clocked.pacman.tile,
      pacmanStep: clocked.pacman.step,
      blinkyTile: clocked.ghosts[GHOST.blinky]?.nextTile ?? clocked.pacman.tile,
    },
    scatter: isScatter(clocked.modes),
    elroy1: clocked.elroy.elroy1,
    tiles: clocked.video.tiles,
  });
  return { ...clocked, ghosts: decided.ghosts, seed: decided.seed };
};
