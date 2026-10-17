import { mealOn, type Meal } from './eating';
import { eatsFruit, fruitPointsText } from './fruit';
import { earnsExtraLife, livesTiles } from './lives';
import { textWrites } from './texts';
import { DELAY, timerOf } from './timers';
import { tuning } from './tuning.config';
import { dotSound, SOUND, withSounds } from './sounds';
import { startFright } from './energizer';
import { tileAddress } from './geometry';
import { countDot } from './house-dots';
import { TILE } from './maze';
import type { Playing } from './playing';
import { HIGH_SCORE_ADDRESS, pointsOf, SCORE_ADDRESS, scoreWrites } from './score';
import { writeVideo } from './video';

/** The extra life, when the score earns it: one more life and one more at the bottom ($2B33). */
const giveExtraLife = (playing: Playing): Playing => {
  if (!earnsExtraLife(playing.score, tuning.extraLifeSetting, playing.extraLife)) return playing;
  const livesShown = playing.livesShown + 1;
  return {
    ...withSounds(playing, SOUND.extraLife),
    extraLife: true,
    lives: playing.lives + 1,
    livesShown,
    video: writeVideo(playing.video, { tiles: livesTiles(livesShown) }),
  };
};

/**
 * Adds points to the score and shows it (routine $2A5A); then the extra life, and the high
 * score when it is beaten. The demo scores nothing.
 */
export const addPoints = (playing: Playing, entry: number): Playing => {
  if (playing.demo) return playing;
  const score = playing.score + pointsOf(entry);
  const hiScore = Math.max(score, playing.hiScore);
  return giveExtraLife({
    ...playing,
    score,
    hiScore,
    video: writeVideo(playing.video, {
      tiles: [
        ...scoreWrites(score, SCORE_ADDRESS),
        ...(hiScore > playing.hiScore ? scoreWrites(hiScore, HIGH_SCORE_ADDRESS) : []),
      ],
    }),
  });
};

/**
 * Pac-Man eats the fruit (routine $199B): its points are added and written under the house
 * for 2 seconds. The fruit disappears but counts as present until its own timer runs out.
 */
export const eatFruit = (playing: Playing): Playing => {
  const { fruit } = playing;
  if (fruit === undefined || !eatsFruit(fruit, playing.pacman.position)) return playing;
  const scored = addPoints(playing, fruit.kind.points);
  return {
    ...withSounds(scored, SOUND.fruit),
    fruit: { ...fruit, shown: false },
    fruitTextTimer: timerOf(DELAY.pause),
    video: writeVideo(scored.video, textWrites(fruitPointsText(fruit.kind))),
  };
};

/** An energizer makes the ghosts blue ($1A03); a dot does nothing more. */
const energize = (playing: Playing, meal: Meal): Playing => {
  if (meal.tile !== TILE.energizer) return playing;
  return withSounds(
    { ...playing, ...startFright(playing.ghosts, playing.settings.frightTime) },
    SOUND.fright,
  );
};

/**
 * Pac-Man eats what is on his tile, if anything ($19CD): the tile is cleared, the points
 * added, Pac-Man pauses, the ghost house counts the dot, and an energizer frightens the ghosts.
 * Each one plays half of the "wakka".
 */
export const eatTile = (playing: Playing): Playing => {
  const address = tileAddress(playing.pacman.tile);
  const meal = mealOn(playing.video.tiles[address] ?? TILE.space);
  if (meal === undefined) return playing;
  const eaten = {
    ...playing,
    video: writeVideo(playing.video, { tiles: [{ address, value: TILE.space }] }),
    dotsEaten: playing.dotsEaten + 1,
    pacman: { ...playing.pacman, pause: meal.pause },
    houseDots: countDot(playing.houseDots, playing.ghosts),
  };
  return withSounds(energize(addPoints(eaten, meal.points), meal), dotSound(eaten.dotsEaten));
};
