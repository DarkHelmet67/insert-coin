/*
 * The extra fighters (`gctl_supv_score`): the factory setting of the cabinet gives one at
 * 20 000 points, one at 70 000 and then one every 70 000. The program compares the two
 * leftmost digits of the score with the next threshold after each change of the score.
 */
import { play, type PlayingState } from './playing';
import { tuning } from './tuning.config';

/** First threshold, and the step of the following ones, in tens of thousands. */
export const FIRST_BONUS = tuning.extraLives.first;
const BONUS_STEP = tuning.extraLives.every;

/** The threshold after `bonus`: 2, then 7, then every 7 with the factory setting. */
export const nextBonus = (bonus: number): number =>
  bonus < BONUS_STEP ? BONUS_STEP : bonus + BONUS_STEP;

/** The state with `points` more, and an extra fighter when the score reaches the threshold. */
export const addPoints = (state: PlayingState, points: number): PlayingState => {
  if (points === 0) return state;
  const score = state.score + points;
  const scored = { ...state, score };
  if (Math.floor(score / 10000) !== state.nextBonus) return scored;
  return play(
    { ...scored, reserve: state.reserve + 1, nextBonus: nextBonus(state.nextBonus) },
    'extraLife',
  );
};
