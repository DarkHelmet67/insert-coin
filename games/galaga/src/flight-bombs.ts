/*
 * The bombs dropped by diving aliens (`l_0D52`-`l_0DF5`): when they may fall and how they drift
 * towards the fighter.
 */
import { coarse, type FlightSlot } from './flight-slot';
import { changeObject, type FlightInputs, type FlightWorld } from './flight-world';
import {
  BOMB_COUNT,
  DISPOSITION,
  FIRST_BOMB,
  objectAt,
  objectIds,
  type GameObject,
} from './objects';
import { divide } from './z80-math';

/** Drift rate of a new bomb towards the fighter (`l_0D8D_got_a_bullet`). */
const bombDriftRate = (bomb: number, bomber: GameObject, fighterX: number): number => {
  const dx = (fighterX - bomber.x) & 0xff;
  const left = fighterX < bomber.x;
  const distanceX = left ? -dx & 0xff : dx;
  const height = (0x95 - (bomber.y >> 1)) & 0xff || 0;
  const distanceY = bomber.y >> 1 > 0x95 ? -height & 0xff : height;
  // The low byte of the dividend is whatever was in L: the bomb's own register address.
  const ratio = divide((distanceX << 8) | ((bomb + 1) & 0xff), distanceY);
  const rate = Math.min((ratio + (ratio >> 2)) >> 2, 0x60);
  return ((left ? 1 : 0) << 7) | (rate >> 1);
};

/**
 * `l_0D52`-`l_0DF5`: every `bombInterval` frames a diving alien may drop a bomb, if one of its
 * bomb bits allows it, it is in the upper part of the screen and a bomb is free.
 */
export const tryBombing = (
  world: FlightWorld,
  slot: FlightSlot,
  inputs: FlightInputs,
): {
  readonly world: FlightWorld;
  readonly slot: FlightSlot;
} => {
  const bombTimer = (slot.bombTimer - 1) & 0xff;
  if (bombTimer !== 0) return { world, slot: { ...slot, bombTimer } };
  const allowed = (slot.bombBits & 1) === 1;
  const reloaded = { ...slot, bombBits: slot.bombBits >> 1, bombTimer: inputs.bombInterval };
  const bomb = objectIds(FIRST_BOMB, BOMB_COUNT).find(
    (id) => objectAt(world.objects, id).disposition === DISPOSITION.inactive,
  );
  if (!allowed || coarse(slot.y) < 0x4c || !inputs.bombsAllowed || bomb === undefined) {
    return { world, slot: reloaded };
  }
  const bomber = objectAt(world.objects, slot.object);
  const drop = changeObject(world, bomb, (o) => ({
    ...o,
    disposition: DISPOSITION.shot,
    x: bomber.x,
    y: bomber.y,
  }));
  const which = (bomb - FIRST_BOMB) >> 1;
  return {
    world: {
      ...drop,
      bombDrift: drop.bombDrift.map((drift, i) =>
        i === which
          ? { rate: bombDriftRate(bomb, bomber, inputs.fighterX), accumulator: 0 }
          : drift,
      ),
    },
    slot: reloaded,
  };
};
