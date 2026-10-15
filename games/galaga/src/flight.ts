import { homeCell, romByte, romWord } from './flight-memory';
import { coarse, poseFor, spritePosition, stepPosition, type FlightSlot } from './flight-slot';
import { cellOrigin, type Formation } from './formation';
import {
  BOMB_COUNT,
  DISPOSITION,
  FIRST_BOMB,
  objectAt,
  objectIds,
  updateObject,
  type GameObject,
  type Objects,
} from './objects';
import { angleTo, divide, signed8 } from './z80-math';

/** What the flight programs read about the rest of the game in this frame. */
export interface FlightInputs {
  /** Frame counter: odd and even frames use different speeds. */
  readonly frame: number;
  /** Sprite x of the fighter, 0 when it is not on screen. */
  readonly fighterX: number;
  /** Few aliens left: they attack nonstop (`b_92A0[$0A]`). */
  readonly continuousBombing: boolean;
  /** A rescued fighter is spinning down to dock (task `f_2000`). */
  readonly rescueRunning: boolean;
  /** Stage parameters 8 and 9: harder attack paths from stage 8 on. */
  readonly harderEntries: boolean;
  readonly harderAttacks: boolean;
  /** Bits allowing a diving alien to drop bombs (`b_92C0[8]`) and frames between tries. */
  readonly bombEnableBits: number;
  readonly bombInterval: number;
  /** The fighter can be bombed: it can fire and is not being captured. */
  readonly bombsAllowed: boolean;
  readonly formation: Formation;
  /** Sprite code and palette a bonus bee takes back when it returns home (`_b_bbee_clr_a`). */
  readonly bonusBeeLook: number;
}

/** Something a flight program asks the rest of the game to do. */
export type FlightEvent =
  | { readonly kind: 'diveSound' }
  | { readonly kind: 'captureDive'; readonly slot: number; readonly targetX: number }
  | { readonly kind: 'bonusBeeHome' };

/** A bomb's horizontal drift: a rate and an accumulator (`b_92B0`). */
export interface BombDrift {
  readonly rate: number;
  readonly accumulator: number;
}

/** Everything the flight runner reads and changes. */
export interface FlightWorld {
  readonly slots: readonly (FlightSlot | undefined)[];
  readonly objects: Objects;
  /** Drift of the 8 bombs, in the order of their objects. */
  readonly bombDrift: readonly BombDrift[];
  readonly events: readonly FlightEvent[];
}

/** Number of flight slots: at most 12 aliens fly at once. */
export const SLOT_COUNT = 12;

/** The game with slot `index` replaced (or emptied with `undefined`). */
const setSlot = (world: FlightWorld, index: number, slot: FlightSlot | undefined): FlightWorld => ({
  ...world,
  slots: world.slots.map((current, i) => (i === index ? slot : current)),
});

/** The game with object `id` changed. */
const changeObject = (
  world: FlightWorld,
  id: number,
  change: (object: GameObject) => GameObject,
): FlightWorld => ({ ...world, objects: updateObject(world.objects, id, change) });

/** The game with one more event. */
const emit = (world: FlightWorld, event: FlightEvent): FlightWorld => ({
  ...world,
  events: [...world.events, event],
});

/** How the processing of a slot continues after a command. */
type Next =
  /** Read the next instruction at `slot.pointer` (`j_090E_flite_path_init`). */
  | { readonly then: 'read'; readonly world: FlightWorld; readonly slot: FlightSlot }
  /** Keep the current movement and fly this frame (`l_0BFF`). */
  | { readonly then: 'fly'; readonly world: FlightWorld; readonly slot: FlightSlot }
  /** Done for this frame; read the next instruction on the next one (`l_0B8B`). */
  | { readonly then: 'wait'; readonly world: FlightWorld; readonly slot: FlightSlot }
  /** The slot is free and the alien gone (`case_0E49`). */
  | { readonly then: 'stop'; readonly world: FlightWorld };

/** Command $FF: the alien leaves the game. */
const stopFlying = (world: FlightWorld, index: number, slot: FlightSlot): Next => ({
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
const runCommand = (
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
 * turning upright in the formation; a bonus bee takes back the look of a bee.
 */
const arriveHome = (
  world: FlightWorld,
  index: number,
  slot: FlightSlot,
  inputs: FlightInputs,
): FlightWorld => {
  const object = objectAt(world.objects, slot.object);
  const isBonusBee = ((object.color + 1) & 7) >= 5;
  const arrived = { ...slot, y: slot.targetY << 8, x: slot.targetX << 8 };
  const placed = placeSprite(
    changeObject(setSlot(world, index, undefined), slot.object, (o) => ({
      ...o,
      disposition: DISPOSITION.rotating,
      ...(isBonusBee
        ? { code: (inputs.bonusBeeLook & 0xf8) + 6, color: inputs.bonusBeeLook & 0x07 }
        : {}),
    })),
    arrived,
    slot.angle,
  );
  return isBonusBee ? emit(placed, { kind: 'bonusBeeHome' }) : placed;
};

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
const tryBombing = (
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
