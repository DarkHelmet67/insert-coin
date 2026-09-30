import type { GameState } from './game';
import { rockCount } from './rocks';
import { countDownToSaucer, saucerShoots, steerSaucer } from './saucer';

/**
 * The saucer's part of a frame [P $6B93-$6CCC], every 4th frame: count down to the next saucer,
 * or steer and shoot the one on screen. During a game both wait while the ship is dead or in
 * hyperspace; after the game the saucers carry on by themselves, as in the attract mode.
 */
export const saucerTurn = (state: GameState): GameState => {
  if ((state.frame & 3) !== 0 || state.saucer?.kind === 'explosion') return state;
  const active = state.phase === 'over' || state.life.kind === 'flying';
  if (!state.saucer) {
    if (!active) return state;
    const counted = countDownToSaucer(state, rockCount(state.rocks), state.score, state.rng);
    return { ...state, ...counted.state, rng: counted.rng };
  }
  // A new course every 128 frames, when the frame counter is 0 or 128.
  const steered =
    (state.frame & 0x7f) === 0
      ? steerSaucer(state.saucer, state.rng)
      : { saucer: state.saucer, rng: state.rng };
  const next = { ...state, saucer: steered.saucer, rng: steered.rng };
  if (!active) return next;
  const fired = saucerShoots(next, next.ship.position, next.score, next.rng);
  return { ...next, ...fired.state, rng: fired.rng };
};
