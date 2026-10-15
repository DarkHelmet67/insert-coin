/*
 * `f_1A80`: the "clone attack", from stage 3 on. When fewer aliens than the stage parameter are
 * left, a resting bee (or butterfly) is chosen as "bonus bee": it flashes in a new color for 64
 * frames, then dives, and on the way splits off two special enemies (`$F2` in its program).
 * Shooting all three is worth 1000, 2000 or 3000 points, shown where the last one falls.
 */
import { ATTACK_PROGRAM, launchDiver, type Attacks } from './attacks';
import { DISPOSITION, objectAt, objectIds, updateObject } from './objects';
import { play, type PlayingState } from './playing';
import { CLONE_BONUS } from './rom/main-rom';
import { currentSettings } from './combat';

/** The three programs of the bonus bee, by its flashing palette 4, 5, 6 (`d_1B5F`). */
const CLONE_PROGRAMS = [0x04ea, 0x0473, 0x04ab] as const;

/** Where the timer starts, and where it goes back when the fighter cannot fire. */
const FLASH_START = 0xc0;
const FLASH_AGAIN = 0xe0;

/** The state with the bonus bee data changed. */
const withAttacks = (state: PlayingState, attacks: Partial<Attacks>): PlayingState => ({
  ...state,
  attacks: { ...state.attacks, ...attacks },
});

/** The task ends for this stage (`l_1B54`). */
const stop = (state: PlayingState): PlayingState => ({
  ...state,
  tasks: { ...state.tasks, clones: false },
});

/** `l_1AAB`: the first resting bee, else butterfly, becomes the bonus bee. */
const choose = (state: PlayingState): PlayingState => {
  const id = [...objectIds(0x08, 20), ...objectIds(0x40, 16)].find(
    (candidate) => objectAt(state.objects, candidate).disposition === DISPOSITION.home,
  );
  if (id === undefined) return state;
  return play(
    withAttacks(state, {
      bonusBee: id,
      bonusBeeTimer: FLASH_START,
      bonusBeeLook: objectAt(state.objects, id).color,
      bonusBeeColor: (Math.floor(state.stage / 4) % 3) + 4,
    }),
    'bonusBee',
  );
};

/** `l_1B00`: the bonus bee dives with the look of a special enemy, the bonus is armed. */
const launch = (state: PlayingState): PlayingState => {
  const { attacks } = state;
  const bee = objectAt(state.objects, attacks.bonusBee);
  if (bee.disposition !== DISPOSITION.home || (bee.hit & 0x80) !== 0) return stop(state);
  const kind = attacks.bonusBeeColor - 4;
  const looked = {
    ...state,
    objects: updateObject(state.objects, attacks.bonusBee, (o) => ({
      ...o,
      code: kind * 8 + 0x56,
    })),
    attacks: {
      ...attacks,
      bonusBeeLook: (bee.code & 0xf8) | (attacks.bonusBeeLook & 0x07),
    },
    tripleLeft: 3,
    tripleBonus: { hundreds: CLONE_BONUS[kind * 2] ?? 0, code: CLONE_BONUS[kind * 2 + 1] ?? 0 },
  };
  const world = launchDiver(
    {
      attacks: looked.attacks,
      objects: looked.objects,
      slots: looked.slots,
      capture: looked.capture,
      dived: false,
    },
    {
      object: attacks.bonusBee,
      mirrored: (attacks.bonusBee & 2) !== 0,
      program: CLONE_PROGRAMS[kind] ?? ATTACK_PROGRAM.bee,
    },
    looked.enemiesEnabled ? currentSettings(looked).bombBits : 0,
  );
  return stop({ ...looked, objects: world.objects, slots: world.slots });
};

/** `l_1AD5`: the bonus bee flashes until the timer runs out, then dives. */
const flash = (state: PlayingState): PlayingState => {
  const { attacks } = state;
  const timer = (attacks.bonusBeeTimer + 1) & 0xff;
  if (timer === 0) {
    return state.tasks.fire ? launch(state) : withAttacks(state, { bonusBeeTimer: FLASH_AGAIN });
  }
  const bee = objectAt(state.objects, attacks.bonusBee);
  if (bee.disposition !== DISPOSITION.home) return stop(state);
  const color = (timer & 0x10) !== 0 ? attacks.bonusBeeColor : attacks.bonusBeeLook & 0x07;
  return {
    ...withAttacks(state, { bonusBeeTimer: timer }),
    objects: updateObject(state.objects, attacks.bonusBee, (o) => ({ ...o, color })),
  };
};

/** `f_1A80`: one frame of the clone attack, on once the waves are home. */
export const cloneAttack = (state: PlayingState): PlayingState => {
  if (!state.tasks.clones || state.alive >= state.params.cloneAttack) return state;
  return state.attacks.bonusBeeTimer === 0 ? choose(state) : flash(state);
};
