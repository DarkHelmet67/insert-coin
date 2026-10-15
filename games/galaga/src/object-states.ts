/*
 * `f_23DD`: the object manager. Every 4 frames each object takes one step of what its
 * disposition says: resting aliens follow the grid and flap their wings, aliens back home turn
 * upright, explosions advance, things that left the screen are removed. Half of the objects are
 * handled on frame 1, the other half on frame 3; on frame 2 the count of aliens in play is
 * published, the number the rest of the game uses to know when a stage is cleared.
 */
import type { FlightSlot } from './flight-slot';
import { homeCell } from './flight-memory';
import type { Formation } from './formation';
import { DISPOSITION, OBJECT_COUNT, type GameObject, type Objects } from './objects';
import { slowClock } from './clock';

/** What the object manager changes. */
export interface ObjectWorld {
  readonly objects: Objects;
  readonly slots: readonly (FlightSlot | undefined)[];
  /** Aliens counted so far in this round of 4 frames (`b_bugs_actv_cnt`). */
  readonly counting: number;
  /** Aliens in play at the last count (`b_bugs_actv_nbr`). */
  readonly alive: number;
}

/** What the object manager reads. */
export interface ObjectInputs {
  readonly frame: number;
  readonly formation: Formation;
  /** Resting aliens follow the grid (`ds_9200_glbls[$0B]`). */
  readonly enemiesEnabled: boolean;
}

/** The result of one step of one object. */
interface Step {
  readonly object: GameObject;
  /** The alien still counts as in play. */
  readonly counts: boolean;
  /** A flight slot to free, or to update with the formation offsets of its cell. */
  readonly freeSlot?: number;
  readonly slotOffsets?: { readonly slot: number; readonly x: number; readonly y: number };
}

/** Removes an object from the screen. */
const remove = (object: GameObject): GameObject => ({
  ...object,
  disposition: DISPOSITION.inactive,
  x: 0,
  flipX: false,
  flipY: false,
  big: false,
  wide: false,
});

/** `l_249B`: a resting alien's sprite is placed at its cell of the grid. */
const atHome = (object: GameObject, id: number, formation: Formation): GameObject => {
  const { row, column } = homeCell(id);
  return {
    ...object,
    x: formation.spriteCoords[column] ?? 0,
    y: formation.spriteCoords[row] ?? 0,
  };
};

/** `case_2488`: resting. The wings flap with the slow clock, every 32 frames. */
const resting = (object: GameObject, id: number, inputs: ObjectInputs): Step => {
  const wings = (slowClock(inputs.frame) >> 1) & 1;
  const flapped = { ...object, code: (object.code & ~1) | wings };
  return {
    object: inputs.enemiesEnabled ? atHome(flapped, id, inputs.formation) : flapped,
    counts: true,
  };
};

/** `case_245F`: back home, the alien turns one drawing at a time until it is upright. */
const rotating = (object: GameObject, id: number, inputs: ObjectInputs): Step => {
  const tile = object.code & 7;
  const turned = object.flipX
    ? tile === 0
      ? { ...object, flipX: false }
      : { ...object, code: object.code - 1 }
    : tile === 6
      ? { ...object, disposition: DISPOSITION.home }
      : { ...object, code: object.code + 1 };
  return { object: atHome(turned, id, inputs.formation), counts: true };
};

/**
 * `case_254D`: a flying alien, a rocket or a bomb outside the screen is removed; an alien also
 * frees its flight slot.
 */
const leaving = (object: GameObject): Step => {
  const half = object.y >> 1;
  const outside = object.x >= 0xf4 || half < 0x0b || half >= 0xa5;
  if (!outside) return { object, counts: object.disposition !== DISPOSITION.shot };
  return object.disposition === DISPOSITION.launched
    ? { object: remove(object), counts: false, freeSlot: object.counter }
    : { object: remove(object), counts: false };
};

/** The score sprites of 1000 points and more use other palettes (`l_24FD`). */
const scorePalette = (code: number, color: number): number => {
  if (code < 0x37) return color;
  return code < 0x3a ? 0x0d : 0x0e;
};

/**
 * `l_24E6`: at the end of an explosion the alien disappears, or shows the score of the hit for
 * 19 steps when the hit notification holds a score sprite.
 */
const endExplosion = (object: GameObject): Step => {
  if (object.hit === 1) return { object: remove(object), counts: false };
  const code = object.hit;
  // Codes from $3B are drawn double width and stay where they are; the others move to the
  // middle of the explosion.
  const wide = code >= 0x3b;
  return {
    object: {
      ...object,
      disposition: DISPOSITION.showingScore,
      counter: 0x13,
      code,
      color: scorePalette(code, object.color),
      x: wide ? object.x : (object.x + 8) & 0xff,
      y: (object.y + 8) & 0x1ff,
      big: false,
      wide,
      // l_2529 rewrites the sprite control with the size only: the score is never mirrored.
      flipX: false,
      flipY: false,
    },
    counts: false,
  };
};

/** `case_24B2`: an explosion, from step $40 to $45; step $44 is drawn double size. */
const exploding = (object: GameObject): Step => {
  if (object.counter === 0x45) return endExplosion(object);
  const step = object.counter + 1;
  if (step === 0x45) return { object: { ...object, counter: step, code: 0x48 }, counts: false };
  if (step === 0x44) {
    const big = {
      ...object,
      counter: step,
      code: 0x44,
      x: (object.x - 8) & 0xff,
      y: (object.y - 8) & 0x1ff,
      big: true,
      // l_24DA writes $0C to the sprite control: double size and no flips, so the explosion
      // and the score after it are drawn upright whatever the alien's pose.
      flipX: false,
      flipY: false,
    };
    return { object: big, counts: false };
  }
  return { object: { ...object, counter: step, code: step }, counts: false };
};

/** `case_2535`: the score of a hit stays on screen for a while. */
const showingScore = (object: GameObject): Step => {
  const counter = object.counter - 1;
  return counter === 0
    ? { object: remove(object), counts: false }
    : { object: { ...object, counter }, counts: false };
};

/** `case_243C`: the fighter's explosion: a new drawing every 4 steps, 15 steps in all. */
const fighterExploding = (object: GameObject): Step => {
  const counter = object.counter - 1;
  if (counter === 0) return { object: remove(object), counts: false };
  const code = (counter & 3) === 0 ? object.code + 4 : object.code;
  return { object: { ...object, counter, code }, counts: false };
};

/** `case_2422`: a diving alien keeps the offsets of its cell up to date in its flight slot. */
const diving = (object: GameObject, id: number, inputs: ObjectInputs): Step => {
  const { row, column } = homeCell(id);
  return {
    object,
    counts: true,
    slotOffsets: {
      slot: object.counter,
      x: inputs.formation.offsets[column] ?? 0,
      y: inputs.formation.offsets[row] ?? 0,
    },
  };
};

/** The step of object `id` for its disposition (`d_23FF_jp_tbl`). */
const step = (object: GameObject, id: number, inputs: ObjectInputs): Step => {
  switch (object.disposition) {
    case DISPOSITION.home:
      return resting(object, id, inputs);
    case DISPOSITION.rotating:
      return rotating(object, id, inputs);
    case DISPOSITION.launched:
    case DISPOSITION.shot:
      return leaving(object);
    case DISPOSITION.exploding:
      return exploding(object);
    case DISPOSITION.showingScore:
      return showingScore(object);
    case DISPOSITION.entering:
      return { object: { ...object, disposition: DISPOSITION.launched }, counts: true };
    case DISPOSITION.fighterExploding:
      return fighterExploding(object);
    case DISPOSITION.flying:
      return diving(object, id, inputs);
    default:
      return { object, counts: false };
  }
};

/** Applies the slot changes asked by a step. */
const applyToSlots = (
  slots: readonly (FlightSlot | undefined)[],
  result: Step,
): readonly (FlightSlot | undefined)[] => {
  const { freeSlot, slotOffsets } = result;
  if (freeSlot !== undefined) return slots.map((s, i) => (i === freeSlot ? undefined : s));
  if (slotOffsets === undefined) return slots;
  return slots.map((s, i) =>
    i === slotOffsets.slot && s !== undefined
      ? { ...s, offsetX: slotOffsets.x, offsetY: slotOffsets.y }
      : s,
  );
};

/** One frame of the object manager. */
export const updateObjectStates = (world: ObjectWorld, inputs: ObjectInputs): ObjectWorld => {
  const { frame } = inputs;
  if ((frame & 1) === 0) {
    return (frame & 2) === 0 ? world : { ...world, alive: world.counting, counting: 0 };
  }
  // Frame 1 handles objects $00, $04, $08 ...; frame 3 objects $02, $06, $0A ...
  const ids = Array.from({ length: OBJECT_COUNT / 2 }, (_, i) => (frame & 2) + i * 4);
  return ids.reduce((current, id) => {
    const object = current.objects[id >> 1];
    if (object === undefined || (object.disposition & DISPOSITION.inactive) !== 0) return current;
    const result = step(object, id, inputs);
    return {
      ...current,
      objects: current.objects.map((o, i) => (i === id >> 1 ? result.object : o)),
      slots: applyToSlots(current.slots, result),
      counting: current.counting + (result.counts ? 1 : 0),
    };
  }, world);
};
