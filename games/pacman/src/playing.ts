import { tileAddress } from './geometry';
import { levelSettings, type LevelSettings } from './levels';
import { mealOn } from './eating';
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
  return {
    level: 1,
    settings,
    video: newGameVideo(hiScore),
    pacman: newPacMan(settings.speeds.pacman, settings.speeds.pacmanFright),
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

/** One pass of the game's core ($1017): the program runs it twice per frame. */
const updateCore = (playing: Playing, joystick: Joystick): Playing => {
  const move = updatePacMan(playing.pacman, joystick, false, playing.video.tiles);
  const moved = { ...playing, pacman: move.pacman };
  return move.canEat ? eat(moved) : moved;
};

/** One frame of play. */
export const updatePlaying = (playing: Playing, joystick: Joystick): Playing =>
  updateCore(updateCore(playing, joystick), joystick);
