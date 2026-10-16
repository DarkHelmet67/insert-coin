import type { Eating } from './eat-ghost';
import type { Fruit } from './fruit';
import { NO_FRIGHT, type Fright } from './energizer';
import { NEW_MODE_CLOCK, NO_ELROY, type ModeClock } from './ghost-modes';
import type { ElroySpeeds, ElroyState } from './ghost-move';
import { GHOST_IDS, newGhost, type Ghost, type GhostId } from './ghosts';
import { NEW_HOUSE_CLOCK, NEW_HOUSE_DOTS, type HouseDots } from './house';
import { levelSettings, type LevelSettings } from './levels';
import { newPacMan, type PacMan } from './pacman';
import type { Timer } from './timers';
import type { SoundWrite } from './sound-board';
import { tuning } from './tuning.config';
import { gameStartVideo } from './screen';
import type { Video } from './video';

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
  /** Lives left, the one in play included ($4E14), and spare lives drawn at the bottom ($4E15). */
  readonly lives: number;
  readonly livesShown: number;
  /** Whether the extra life has been given ($4E83). */
  readonly extraLife: boolean;
  /** The death animation's counter, once a ghost has caught Pac-Man ($4DC5). */
  readonly death: number;
  /** The fruit under the house, and which of the level's two fruits have come out ($4E0C). */
  readonly fruit: Fruit | undefined;
  readonly fruitsReleased: readonly boolean[];
  /**
   * The timed tasks that take the fruit away and erase its points ($4C90). They are not part
   * of the game's RAM that a new life clears, so they keep running across a death.
   */
  readonly fruitTimer: Timer | undefined;
  readonly fruitTextTimer: Timer | undefined;
  /** The writes to the sound program's trigger bytes in this frame. */
  readonly sounds: readonly SoundWrite[];
}

/** The part of the game a new life or a new level starts afresh: RAM $4D00-$4DFF (task $11). */
export type LifeState = Omit<
  Playing,
  | 'level'
  | 'video'
  | 'houseDots'
  | 'dotsEaten'
  | 'score'
  | 'hiScore'
  | 'lives'
  | 'livesShown'
  | 'extraLife'
  | 'fruitsReleased'
  | 'fruitTimer'
  | 'fruitTextTimer'
  | 'sounds'
>;

/** The actors in their places and every clock at zero, with the settings of `level`. */
export const newLife = (level: number): LifeState => {
  const settings = levelSettings(level);
  const { speeds } = settings;
  return {
    settings,
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
    houseClock: NEW_HOUSE_CLOCK,
    houseTimer: 0,
    dotsAtLastMove: 0,
    death: 0,
    fruit: undefined,
  };
};

/** A new game at level 1, before the first life takes the field. */
export const newPlaying = (hiScore: number): Playing => ({
  ...newLife(1),
  level: 1,
  video: gameStartVideo(hiScore, tuning.lives),
  houseDots: NEW_HOUSE_DOTS,
  dotsEaten: 0,
  score: 0,
  hiScore,
  lives: tuning.lives,
  livesShown: tuning.lives,
  extraLife: false,
  fruitsReleased: [false, false],
  fruitTimer: undefined,
  fruitTextTimer: undefined,
  sounds: [],
});

/** The level counter of the program ($4E13): one byte, 0 for the first level. */
export const roundOf = (playing: Pick<Playing, 'level'>): number => (playing.level - 1) & 0xff;

/** The game with one ghost replaced. */
export const withGhost = (playing: Playing, ghost: Ghost): Playing => ({
  ...playing,
  ghosts: playing.ghosts.map((other) => (other.id === ghost.id ? ghost : other)),
});
