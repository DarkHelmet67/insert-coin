import { NEW_HOUSE_DOTS } from './house';
import { livesTiles } from './lives';
import { newLife, roundOf, type Playing } from './playing';
import { allDots, mazeVideo, savedDots } from './screen';
import { TEXT, textWrites } from './texts';
import { writeVideo } from './video';

/**
 * The first life takes the field (routines $06A8 and $0899): one life leaves the row at the
 * bottom and "PLAYER ONE" is erased; "READY!" stays.
 */
export const firstLife = (playing: Playing): Playing => {
  const livesShown = playing.livesShown - 1;
  return {
    ...playing,
    livesShown,
    video: writeVideo(writeVideo(playing.video, textWrites(TEXT.playerOne, true)), {
      tiles: livesTiles(livesShown),
    }),
  };
};

/** The death animation is over: a life is gone, from the count and from the row ($1366). */
export const loseLife = (playing: Playing): Playing => ({
  ...playing,
  lives: playing.lives - 1,
  livesShown: Math.max(playing.livesShown - 1, 0),
});

/**
 * A new life in the same level (routines $090D and $0988): the dots left are saved and drawn
 * again on a clean maze, the actors go back to their places, and from now on the house
 * counts the dots with its global counter ($4E12).
 */
export const nextLife = (playing: Playing): Playing => ({
  ...playing,
  ...newLife(playing.level),
  video: mazeVideo(
    playing.video,
    savedDots(playing.video),
    roundOf(playing),
    playing.livesShown,
    playing.demo,
  ),
  houseDots: { ...playing.houseDots, global: 0 },
});

/**
 * The next level (routines $0A7C and $0988): the level counter grows, the dots, the fruits
 * and the house counters start again, and the maze is drawn full.
 */
export const nextLevel = (playing: Playing): Playing => {
  const level = playing.level + 1;
  return {
    ...playing,
    ...newLife(level),
    level,
    video: mazeVideo(
      playing.video,
      allDots(),
      roundOf({ level }),
      playing.livesShown,
      playing.demo,
    ),
    houseDots: NEW_HOUSE_DOTS,
    dotsEaten: 0,
    fruitsReleased: [false, false],
  };
};

/**
 * The demo game (routines $06BE, $0879 and $0988): level 1 with all its dots, the one life
 * the chase left, no lives shown and "GAME OVER" on the screen while the program plays.
 */
export const demoPlaying = (playing: Playing): Playing => ({
  ...playing,
  ...newLife(1),
  demo: true,
  level: 1,
  video: mazeVideo(playing.video, allDots(), 0, 0, true),
  houseDots: NEW_HOUSE_DOTS,
  dotsEaten: 0,
  fruitsReleased: [false, false],
});
