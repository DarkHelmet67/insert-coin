import { describe, expect, it } from 'vitest';
import { collide } from './combat';
import { noControls } from './controls';
import { debug, DEBUG_OFF } from './debug';
import { newGame } from './game';
import { BOMB_CODE } from './bombs';
import { DISPOSITION, FIGHTER, FIGHTER_2, FIRST_BOMB, objectAt, updateObject } from './objects';
import { emptyPlayingState, type PlayingState } from './playing';
import { placeFighters } from './program';
import { tryToCatch } from './tractor-beam';
import { tuning } from './tuning.config';
import { updatePlaying } from './update-playing';

/**
 * `frames` frames of play from `start`, sweeping left and right; `fire` says on which frames
 * the button is pressed, `safe` keeps the fighter from being hit.
 */
const simulate = (
  frames: number,
  fire: (frame: number) => boolean,
  safe: boolean,
): readonly PlayingState[] =>
  Array.from({ length: frames }).reduce<readonly PlayingState[]>(
    (states, _, f) => {
      const state = states.at(-1) ?? newGame(1);
      const guarded = safe ? { ...state, tasks: { ...state.tasks, fighterHits: false } } : state;
      const direction = safe ? 0 : ((f >> 7) & 1) === 0 ? 1 : -1;
      return [...states, updatePlaying(guarded, { ...noControls, direction, fire: fire(f) })];
    },
    [newGame(1)],
  );

describe('debug mode', () => {
  it('is off in the published game', () => {
    expect(tuning.debug.enabled).toBe(false);
    expect(debug).toEqual(DEBUG_OFF);
  });

  it('starts from the chosen stage: the counter grows by one before each stage', () => {
    expect(newGame(1).stage).toBe(0);
    expect(newGame(7).stage).toBe(6);
  });

  it('in god mode a bomb on the fighter does not destroy it', () => {
    const states = simulate(1500, (f) => f % 8 === 0, false);
    const running = states.find(
      (s) => s.tasks.stick && s.tasks.fighterHits && objectAt(s.objects, FIGHTER).x !== 0,
    );
    expect(running).toBeDefined();
    if (!running) return;
    const fighter = objectAt(running.objects, FIGHTER);
    const bombed: PlayingState = {
      ...running,
      objects: updateObject(running.objects, FIRST_BOMB, (o) => ({
        ...o,
        x: fighter.x,
        y: fighter.y,
        code: BOMB_CODE,
        disposition: DISPOSITION.shot,
        hit: 0,
      })),
    };
    expect(collide(bombed, false).restart).toBe(true);
    const spared = collide(bombed, true);
    expect(spared.restart).toBe(false);
    expect(objectAt(spared.objects, FIGHTER)).toEqual(fighter);
  });

  it('with noCapture the open beam never catches the fighter', () => {
    const states = simulate(4000, () => false, true);
    const before = states.find(
      (s) => !s.capture.tasks.pull && tryToCatch(s, false).capture.tasks.pull,
    );
    expect(before).toBeDefined();
    if (!before) return;
    expect(tryToCatch(before, true)).toBe(before);
  });

  it('with startDual the new fighter is a double fighter that no Boss can capture', () => {
    const empty = emptyPlayingState({ step: 'respawn' });
    expect(placeFighters(empty, false).dual).toBe(false);
    const dual = placeFighters(empty, true);
    expect(dual).toMatchObject({ dual: true, capture: { busy: true } });
    const main = objectAt(dual.objects, FIGHTER);
    expect(objectAt(dual.objects, FIGHTER_2)).toMatchObject({ y: main.y, x: main.x + 0x0f });
  });
});
