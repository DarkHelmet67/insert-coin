/*
 * The fight, as tasks of a frame: aliens leave the formation (`f_1B65`), bombs fall (`f_1EA4`),
 * rockets and bombs hit (`hitd_*`), hit aliens explode (`f_1DB3`) and the hit counters become
 * points. Each task reads and returns the whole game state, like the others in
 * `update-playing.ts`.
 */
import { runAttacks } from './attacks';
import { bomberSettings, continuousBombing, type BomberSettings } from './bomber-timers';
import { moveBombs } from './bombs';
import { setTimer } from './clock';
import { detectHits, explodeFighter, startExplosions, type HitWorld } from './hits';
import { FIGHTER, objectAt } from './objects';
import { flyingCount, play, type PlayingState } from './playing';
import { hitPoints, NO_HITS } from './score';
import { challengeBonus } from './stage-setup';

/** Whether the aliens attack nonstop: few are left and the fighter can fire. */
export const isContinuous = (state: PlayingState): boolean =>
  continuousBombing(state.params, state.alive, state.tasks.fire);

/** `f_0857`: the bomber settings of this moment. */
export const currentSettings = (state: PlayingState): BomberSettings =>
  bomberSettings(state.params, state.alive, state.timers[2], isContinuous(state), state.maxBombers);

/** `f_1B65`: when its task is on, an alien may leave the formation. */
export const attack = (state: PlayingState): PlayingState => {
  if (!state.tasks.attacks) return state;
  const settings = currentSettings(state);
  const world = runAttacks(
    { attacks: state.attacks, objects: state.objects, slots: state.slots, dived: false },
    {
      frame: state.frame,
      settings,
      flying: flyingCount(state),
      enemiesEnabled: state.enemiesEnabled,
      fireEnabled: state.tasks.fire,
      rescueRunning: false,
    },
  );
  const updated = {
    ...state,
    attacks: world.attacks,
    objects: world.objects,
    slots: world.slots,
    maxBombers: settings.maxBombers,
  };
  return world.dived ? play(updated, 'dive') : updated;
};

/** `f_1DB3`: hit aliens start exploding. */
export const explode = (state: PlayingState): PlayingState => ({
  ...state,
  objects: startExplosions(state.objects),
});

/** `f_1EA4`: one frame of the bombs. */
export const fallBombs = (state: PlayingState): PlayingState => {
  const { objects, drift } = moveBombs(state.objects, state.bombDrift, state.frame);
  return { ...state, objects, bombDrift: drift };
};

/** The part of the game state the hit checks change. */
const hitWorld = (state: PlayingState): HitWorld => ({
  objects: state.objects,
  slots: state.slots,
  hitCounts: NO_HITS,
  rocketHits: state.hits,
  flyingHits: state.flyingHits,
  groupLeft: state.groupLeft,
  attacks: state.attacks,
  captureBoss: state.captureBoss,
  tripleLeft: state.tripleLeft,
  tripleBonus: state.tripleBonus,
  sounds: state.sounds,
  fighterHit: false,
});

/**
 * `hitd_fghtr_hit`: the fighter explodes where it was. The joystick and the fire button stop,
 * the stars stop, and the main program will restart the stage.
 */
const loseFighter = (state: PlayingState): PlayingState => {
  const fighter = objectAt(state.objects, FIGHTER);
  return play(
    {
      ...state,
      objects: explodeFighter(state.objects, fighter.x, fighter.y),
      tasks: { ...state.tasks, stick: false, fire: false },
      starControl: { ...state.starControl, shipOnScreen: false },
      dual: false,
      restart: true,
    },
    'fighterHit',
  );
};

/** One frame of collisions; the hits are turned into points at once. */
export const collide = (state: PlayingState): PlayingState => {
  const world = detectHits(
    hitWorld(state),
    {
      dual: state.dual,
      rescueRunning: false,
      wavesEntering: state.launcher.running,
      challengeBonus: challengeBonus(state.stage),
    },
    state.starControl.shipOnScreen,
  );
  const updated: PlayingState = {
    ...state,
    objects: world.objects,
    slots: world.slots,
    hits: world.rocketHits,
    flyingHits: world.flyingHits,
    groupLeft: world.groupLeft,
    attacks: world.attacks,
    captureBoss: world.captureBoss,
    tripleLeft: world.tripleLeft,
    sounds: world.sounds,
    score: state.score + hitPoints(world.hitCounts),
    timers:
      world.quietTimer === undefined ? state.timers : setTimer(state.timers, 1, world.quietTimer),
  };
  return world.fighterHit ? loseFighter(updated) : updated;
};
