import { mealOn } from './eating';
import { tileAddress } from './geometry';
import { countDot } from './house';
import { TILE } from './maze';
import type { Playing } from './playing';
import { HIGH_SCORE_ADDRESS, pointsOf, SCORE_ADDRESS, scoreWrites } from './score';
import { writeVideo } from './video';

/** Adds points to the score and shows it, with the high score when it is beaten ($2A5A). */
export const addPoints = (playing: Playing, entry: number): Playing => {
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

/**
 * Pac-Man eats what is on his tile, if anything ($19CD): the tile is cleared, the points
 * added, Pac-Man pauses, and the ghost house counts the dot.
 */
export const eatTile = (playing: Playing): Playing => {
  const address = tileAddress(playing.pacman.tile);
  const meal = mealOn(playing.video.tiles[address] ?? TILE.space);
  if (meal === undefined) return playing;
  return addPoints(
    {
      ...playing,
      video: writeVideo(playing.video, { tiles: [{ address, value: TILE.space }] }),
      dotsEaten: playing.dotsEaten + 1,
      pacman: { ...playing.pacman, pause: meal.pause },
      houseDots: countDot(playing.houseDots, playing.ghosts),
    },
    meal.points,
  );
};
