/*
 * The flight runner of the second processor (`f_08D3`): each of the 12 slots reads its flight
 * program from the ROM and moves its alien one frame. Commands are in `flight-commands.ts`, bombs
 * in `flight-bombs.ts`, the shared data in `flight-world.ts`.
 */
import { tryBombing } from './flight-bombs';
import { runCommand, stopFlying, type Next } from './flight-commands';
import { romByte } from './flight-memory';
import { coarse, poseFor, spritePosition, stepPosition, type FlightSlot } from './flight-slot';
import {
  changeObject,
  emit,
  setSlot,
  SLOT_COUNT,
  type FlightInputs,
  type FlightWorld,
} from './flight-world';
import { DISPOSITION, objectAt } from './objects';
import { signed8 } from './z80-math';

export {
  SLOT_COUNT,
  type BombDrift,
  type FlightEvent,
  type FlightInputs,
  type FlightWorld,
} from './flight-world';

/** `l_0BDC`: an ordinary instruction sets two speeds, a rotation and a duration. */
const loadInstruction = (slot: FlightSlot): FlightSlot => {
  const p = slot.pointer;
  const speeds = romByte(p);
  const turn = romByte(p + 1);
  return {
    ...slot,
    speedOdd: speeds & 0x0f,
    speedEven: speeds >> 4,
    turn: slot.mirrored ? -turn & 0xff : turn,
    timer: romByte(p + 2),
    pointer: p + 3,
  };
};

/** The first instruction token that is a command. */
const COMMAND_FIRST = 0xef;

/** Commands can chain (a jump, then a jump...): a safety limit against a looping program. */
const MAX_COMMANDS_PER_FRAME = 16;

/** Reads instructions from `slot.pointer` until one sets a movement or ends the frame. */
const readProgram = (
  world: FlightWorld,
  index: number,
  slot: FlightSlot,
  inputs: FlightInputs,
  depth = 0,
): Next => {
  const token = romByte(slot.pointer);
  if (token < COMMAND_FIRST) return { then: 'fly', world, slot: loadInstruction(slot) };
  if (depth >= MAX_COMMANDS_PER_FRAME) return stopFlying(world, index, slot);
  const next = runCommand(~token & 0xff, world, index, slot, inputs);
  return next.then === 'read' ? readProgram(next.world, index, next.slot, inputs, depth + 1) : next;
};

/** Whether two coarse coordinates are at most one unit (2 pixels) apart. */
const near = (a: number, b: number): boolean => Math.abs(signed8(a - b)) <= 1;

/** `l_0D03`: the sprite of the slot's object follows the slot. */
const placeSprite = (world: FlightWorld, slot: FlightSlot, angle: number): FlightWorld => {
  const pose = poseFor(angle);
  const { x, y } = spritePosition(slot);
  return changeObject(world, slot.object, (o) => ({
    ...o,
    code: (o.code & 0xf8) | pose.tile,
    flipX: pose.flipX,
    flipY: pose.flipY,
    x,
    y,
  }));
};

/**
 * `l_0E08_imhome`: the alien has reached its cell. The slot is freed and the object starts
 * turning upright in the formation; a bonus bee takes back the look of a bee. Only the position
 * of the sprite changes (`l_0D03`): drawing and flips stay those of the last frame of flight.
 */
const arriveHome = (
  world: FlightWorld,
  index: number,
  slot: FlightSlot,
  inputs: FlightInputs,
): FlightWorld => {
  const object = objectAt(world.objects, slot.object);
  const isBonusBee = ((object.color + 1) & 7) >= 5;
  const { x, y } = spritePosition({ ...slot, y: slot.targetY << 8, x: slot.targetX << 8 });
  const placed = changeObject(setSlot(world, index, undefined), slot.object, (o) => ({
    ...o,
    disposition: DISPOSITION.rotating,
    x,
    y,
    ...(isBonusBee
      ? { code: (inputs.bonusBeeLook & 0xf8) + 6, color: inputs.bonusBeeLook & 0x07 }
      : {}),
  }));
  return isBonusBee ? emit(placed, { kind: 'bonusBeeHome' }) : placed;
};

/** `l_0C05`-`l_0DF5`: one frame of flight along the current instruction. */
const fly = (
  world: FlightWorld,
  index: number,
  slot: FlightSlot,
  inputs: FlightInputs,
): FlightWorld => {
  if (slot.homing && near(coarse(slot.y), slot.targetY) && near(coarse(slot.x), slot.targetX)) {
    return arriveHome(world, index, slot, inputs);
  }
  const dy = (coarse(slot.y) - slot.targetY) & 0xff;
  const reachedDive = slot.diveCheck && (dy === 0 || dy === 0xff);
  const checked = reachedDive ? { ...slot, timer: 1, diveCheck: false } : slot;
  const speed = (inputs.frame & 1) === 1 ? checked.speedOdd : checked.speedEven;
  const moved: FlightSlot = {
    ...checked,
    ...stepPosition(checked, checked.angle, speed),
    angle: (checked.angle + signed8(checked.turn)) & 0x3ff,
  };
  // The sprite is drawn with the direction before this frame's rotation.
  const placed = placeSprite(world, moved, checked.angle);
  const bombing = tryBombing(placed, moved, inputs);
  return setSlot(bombing.world, index, bombing.slot);
};

/** One frame of one slot: the "bug motion runner" `f_08D3` for slot `index`. */
const runSlot = (world: FlightWorld, index: number, inputs: FlightInputs): FlightWorld => {
  const slot = world.slots[index];
  if (slot === undefined) return world;
  const disposition = objectAt(world.objects, slot.object).disposition;
  if (
    disposition !== DISPOSITION.launched &&
    disposition !== DISPOSITION.flying &&
    disposition !== DISPOSITION.entering
  ) {
    return stopFlying(world, index, slot).world;
  }
  const timer = (slot.timer - 1) & 0xff;
  if (timer !== 0) return fly(world, index, { ...slot, timer }, inputs);
  const next = readProgram(world, index, { ...slot, timer }, inputs);
  switch (next.then) {
    case 'stop':
      return next.world;
    case 'wait':
      return setSlot(next.world, index, { ...next.slot, timer: (next.slot.timer + 1) & 0xff });
    case 'fly':
    case 'read':
      return fly(next.world, index, next.slot, inputs);
  }
};

/** One frame of all flight slots, in order. */
export const runFlights = (world: FlightWorld, inputs: FlightInputs): FlightWorld =>
  Array.from({ length: SLOT_COUNT }, (_, i) => i).reduce(
    (current, index) => runSlot(current, index, inputs),
    world,
  );
