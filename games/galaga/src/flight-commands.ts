/*
 * The commands $EF-$FF of the flight programs (`d_0920_jp_tbl`): jumps, aiming at the fighter,
 * heading home, the capture dive, the bonus bee's split.
 */
import { homeCell, romByte, romWord } from './flight-memory';
import { coarse, type FlightSlot } from './flight-slot';
import { changeObject, emit, setSlot, type FlightInputs, type FlightWorld } from './flight-world';
import { cellOrigin } from './formation';
import { DISPOSITION, objectAt, objectIds } from './objects';
import { angleTo, divide, signed8 } from './z80-math';

/** How the processing of a slot continues after a command. */
export type Next =
  /** Read the next instruction at `slot.pointer` (`j_090E_flite_path_init`). */
  | { readonly then: 'read'; readonly world: FlightWorld; readonly slot: FlightSlot }
  /** Keep the current movement and fly this frame (`l_0BFF`). */
  | { readonly then: 'fly'; readonly world: FlightWorld; readonly slot: FlightSlot }
  /** Done for this frame; read the next instruction on the next one (`l_0B8B`). */
  | { readonly then: 'wait'; readonly world: FlightWorld; readonly slot: FlightSlot }
  /** The slot is free and the alien gone (`case_0E49`). */
  | { readonly then: 'stop'; readonly world: FlightWorld };

/** Command $FF: the alien leaves the game. */
export const stopFlying = (world: FlightWorld, index: number, slot: FlightSlot): Next => ({
  then: 'stop',
  world: setSlot(
    changeObject(world, slot.object, (o) => ({ ...o, disposition: DISPOSITION.inactive, x: 0 })),
    index,
    undefined,
  ),
});

/**
 * Commands $FE and $F3 pick the length of the next turn from a table of 8 bytes, according to
 * where the fighter is: the aliens "aim" by turning longer or shorter.
 */
const aimedTurn = (slot: FlightSlot, index: number): FlightSlot => ({
  ...slot,
  timer: romByte(slot.pointer + index),
  pointer: slot.pointer + 9,
});

/** `case_0B16` ($FE): aim by the fighter's distance from the screen side the alien comes from. */
const aimFromSide = (slot: FlightSlot, inputs: FlightInputs): FlightSlot => {
  const fighterX = inputs.fighterX === 0 ? 0x80 : inputs.fighterX;
  const distance = ((slot.mirrored ? fighterX : (0xf2 - fighterX) & 0xff) + 0x0e) & 0xff;
  return aimedTurn(slot, divide(distance << 8, 0x1e) >> 8);
};

/** `case_0A01` ($F3): aim by the horizontal distance between the alien and the fighter. */
const aimAtFighter = (slot: FlightSlot, inputs: FlightInputs): FlightSlot => {
  const fighterX = Math.min(Math.max(inputs.fighterX, 0x1e), 0xd1);
  const half = signed8((((fighterX >> 1) - coarse(slot.x)) & 0x1ff) >> 1);
  const offset = (slot.mirrored ? -half : half) + 0x18;
  const clamped = Math.min(Math.max(offset, 0), 0x2f);
  return aimedTurn(slot, Math.floor(clamped / 6) + 1);
};

/**
 * `case_0AA0` ($FB): head home. The alien's position is moved into the frame of the grid's
 * origin, the offset of its cell is frozen and added back when drawing, and the direction is
 * set straight towards the origin of its cell.
 */
const headHome = (world: FlightWorld, slot: FlightSlot, inputs: FlightInputs): Next => {
  const { row, column } = homeCell(slot.object);
  const offsetX = inputs.formation.offsets[column] ?? 0;
  const offsetY = inputs.formation.offsets[row] ?? 0;
  const y = (slot.y + signed8(offsetY) * 128) & 0xffff;
  const x = (slot.x - signed8(offsetX) * 128) & 0xffff;
  const targetY = cellOrigin(row);
  const targetX = cellOrigin(column) >> 1;
  return {
    then: 'read',
    world: changeObject(world, slot.object, (o) => ({ ...o, disposition: DISPOSITION.flying })),
    slot: {
      ...slot,
      x,
      y,
      offsetX,
      offsetY,
      angle: angleTo(targetY, targetX, coarse(y), coarse(x)),
      targetY,
      targetX,
      homing: true,
      pointer: slot.pointer + 1,
    },
  };
};

/** `case_0A53` ($F4): the Boss that will capture the fighter dives towards it. */
const captureDive = (
  world: FlightWorld,
  index: number,
  slot: FlightSlot,
  inputs: FlightInputs,
): Next => {
  const aligned = (((inputs.fighterX + 3) & 0xf8) + 1) & 0xff;
  const targetX = Math.min(Math.max(aligned, 0x29), 0xc9);
  return {
    then: 'read',
    world: emit(world, { kind: 'captureDive', slot: index, targetX }),
    slot: {
      ...slot,
      angle: angleTo(0x48, targetX >> 1, coarse(slot.y), coarse(slot.x)),
      pointer: slot.pointer + 1,
    },
  };
};

/** `case_097B` ($F2): a bonus bee splits off a special enemy that flies its own program. */
const splitOff = (world: FlightWorld, slot: FlightSlot): Next => {
  const transient = objectIds(0x38, 4).find(
    (id) => objectAt(world.objects, id).disposition === DISPOSITION.inactive,
  );
  // The free slot is searched from the last one, as the original does.
  const free = [...world.slots.keys()].reverse().find((i) => world.slots[i] === undefined);
  if (transient === undefined || free === undefined) {
    return { then: 'read', world, slot: { ...slot, pointer: slot.pointer + 3 } };
  }
  const parent = objectAt(world.objects, slot.object);
  const clone: FlightSlot = {
    ...slot,
    targetY: 0,
    targetX: 0,
    offsetX: 0,
    offsetY: 0,
    pointer: romWord(slot.pointer + 1),
    speedOdd: 1,
    speedEven: 2,
    timer: 1,
    object: transient,
  };
  const withClone = changeObject(setSlot(world, free, clone), transient, (o) => ({
    ...o,
    code: parent.code,
    color: parent.color,
    disposition: DISPOSITION.flying,
    counter: free,
  }));
  return { then: 'read', world: withClone, slot: { ...slot, pointer: slot.pointer + 3 } };
};

/** Commands $EF-$FF, by their complemented value (`d_0920_jp_tbl`). */
export const runCommand = (
  command: number,
  world: FlightWorld,
  index: number,
  slot: FlightSlot,
  inputs: FlightInputs,
): Next => {
  const p = slot.pointer;
  /** Continue reading at `pointer`. */
  const readAt = (pointer: number, w: FlightWorld = world): Next => ({
    then: 'read',
    world: w,
    slot: { ...slot, pointer },
  });
  /** Stop for this frame, resuming at `pointer`. */
  const waitAt = (pointer: number, changed: FlightSlot = slot): Next => ({
    then: 'wait',
    world,
    slot: { ...changed, pointer },
  });
  switch (command) {
    case 0x00:
      return stopFlying(world, index, slot);
    case 0x01:
      return { then: 'fly', world, slot: aimFromSide(slot, inputs) };
    case 0x02:
      return readAt(romWord(p + 1));
    case 0x03:
      return {
        then: 'fly',
        world,
        slot: { ...slot, targetY: romByte(p + 1), targetX: 0, diveCheck: true, pointer: p + 2 },
      };
    case 0x04:
      return headHome(world, slot, inputs);
    case 0x05:
      return inputs.continuousBombing && !inputs.rescueRunning
        ? readAt(p + 3)
        : readAt(romWord(p + 1));
    case 0x06: {
      const column = homeCell(slot.object).column;
      const x = ((inputs.formation.spriteCoords[column] ?? 0) >> 1) << 8;
      const moved = { ...slot, x: x | (slot.x & 0xff) };
      const next = waitAt(p + 1, moved);
      return inputs.continuousBombing
        ? { ...next, world: emit(world, { kind: 'diveSound' }) }
        : next;
    }
    case 0x07:
      return waitAt(p + 1, { ...slot, y: (0x9c << 8) | (slot.y & 0xff) });
    case 0x08:
      return (slot.object & 0x38) === 0x38 ? readAt(romWord(p + 1)) : readAt(p + 3);
    case 0x09: {
      const raw = romByte(p + 1);
      const angle = slot.mirrored ? -(raw + 0x80) & 0xff : raw;
      return waitAt(p + 2, {
        ...slot,
        angle: (angle << 2) & 0x3ff,
        bombTimer: 0x1e,
        bombBits: inputs.bombEnableBits,
      });
    }
    case 0x0a:
      return readAt(
        p + 1,
        changeObject(world, slot.object, (o) => ({ ...o, disposition: DISPOSITION.launched })),
      );
    case 0x0b:
      return captureDive(world, index, slot, inputs);
    case 0x0c:
      return { then: 'fly', world, slot: aimAtFighter(slot, inputs) };
    case 0x0d:
      return splitOff(world, slot);
    case 0x0e: {
      const row = homeCell(slot.object).row;
      const y = ((cellOrigin(row) + 0x20) & 0xff) << 8;
      return waitAt(p + 1, { ...slot, y: y | (slot.y & 0xff) });
    }
    case 0x0f:
      return inputs.harderEntries ? waitAt(romWord(p + 1)) : waitAt(p + 3);
    case 0x10:
      return inputs.harderAttacks ? waitAt(romWord(p + 1)) : waitAt(p + 3);
    default:
      return stopFlying(world, index, slot);
  }
};
