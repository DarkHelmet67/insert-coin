import type { Eating } from './eat-ghost';
import { NO_FRIGHT, type Fright } from './energizer';
import { NEW_MODE_CLOCK, NO_ELROY, type ModeClock } from './ghost-modes';
import type { ElroySpeeds, ElroyState } from './ghost-move';
import { GHOST_IDS, newGhost, type Ghost, type GhostId } from './ghosts';
import { NEW_HOUSE_CLOCK, NEW_HOUSE_DOTS, type HouseDots } from './house';
import { levelSettings, type LevelSettings } from './levels';
import { newMazeWrites, TILE } from './maze';
import { newPacMan, type PacMan } from './pacman';
import { HIGH_SCORE_ADDRESS, SCORE_ADDRESS, scoreWrites } from './score';
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
  /** The effect of the last energizer. */
  readonly fright: Fright;
  /** Frames counted toward the next blink of the energizers ($4DCF). */
  readonly blinkFrames: number;
  /** A ghost being eaten ($4DAB). */
  readonly eating: Eating | undefined;
  /** The ghost that caught Pac-Man ($4DA5). */
  readonly killer: GhostId | undefined;
  /** The dots counted by the house, and its clocks: moves ($4D94) and idle frames ($4D97). */
  readonly houseDots: HouseDots;
  readonly houseClock: number;
  readonly houseTimer: number;
  /** Dots and energizers eaten in this level ($4E0E), and as of Pac-Man's last move ($4D9E). */
  readonly dotsEaten: number;
  readonly dotsAtLastMove: number;
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
    fright: NO_FRIGHT,
    blinkFrames: 0,
    eating: undefined,
    killer: undefined,
    houseDots: NEW_HOUSE_DOTS,
    houseClock: NEW_HOUSE_CLOCK,
    houseTimer: 0,
    dotsEaten: 0,
    dotsAtLastMove: 0,
    score: 0,
    hiScore,
  };
};

/** The game with one ghost replaced. */
export const withGhost = (playing: Playing, ghost: Ghost): Playing => ({
  ...playing,
  ghosts: playing.ghosts.map((other) => (other.id === ghost.id ? ghost : other)),
});
