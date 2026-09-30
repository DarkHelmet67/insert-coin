import { nextRandom, type Rng } from './random';
import {
  EXPLOSION_START,
  randomShape,
  randomVelocity,
  type Rock,
  type RockSize,
  type RockSlot,
} from './rocks';

/** Result of breaking a rock: the new slots and the generator after its draws. */
export interface SplitResult {
  readonly slots: readonly RockSlot[];
  readonly rng: Rng;
}

/**
 * Index of a free slot, searching downwards from `from` like the program [P $745A]; -1 when
 * every slot is taken.
 */
export const freeRockSlot = (slots: readonly RockSlot[], from: number): number =>
  slots.slice(0, from + 1).lastIndexOf(null);

/** Moves the low byte of a coordinate a little, by the low bits of a speed [P $7630]. */
const nudge = (coordinate: number, speed: number): number =>
  (coordinate & ~0xff) | ((coordinate & 0xff) ^ (((speed & 0x1f) << 1) & 0xff));

/**
 * A child of a broken rock [P $6A9D, $7203]: same place, the smaller size, a random outline and a
 * velocity drawn around the parent's. The first child is nudged sideways, the second up or down,
 * so they do not start exactly on top of each other.
 */
const newChild = (
  parent: Rock,
  size: RockSize,
  rng: Rng,
  nudgeAxis: 'x' | 'y',
): { readonly child: Rock; readonly rng: Rng } => {
  const shape = nextRandom(rng);
  const velocity = randomVelocity(shape.rng, parent.vx, parent.vy);
  const { x, y } = parent.position;
  return {
    child: {
      kind: 'rock',
      position:
        nudgeAxis === 'x' ? { x: nudge(x, velocity.vx), y } : { x, y: nudge(y, velocity.vy) },
      vx: velocity.vx,
      vy: velocity.vy,
      size,
      shape: randomShape(shape.value),
    },
    rng: velocity.rng,
  };
};

/** Puts `rock` in the first free slot at or below `from`; unchanged when there is none. */
const placeChild = (
  slots: readonly RockSlot[],
  from: number,
  make: () => { readonly child: Rock; readonly rng: Rng },
  rng: Rng,
): SplitResult & { readonly slot: number } => {
  const slot = freeRockSlot(slots, from);
  if (slot < 0) return { slots, rng, slot };
  const { child, rng: next } = make();
  return { slots: slots.map((old, i) => (i === slot ? child : old)), rng: next, slot };
};

/** The two children of a broken rock, in the highest free slots [P $761D-$7653]. */
const placeChildren = (
  slots: readonly RockSlot[],
  parent: Rock,
  size: RockSize,
  rng: Rng,
): SplitResult => {
  const first = placeChild(slots, slots.length - 1, () => newChild(parent, size, rng, 'x'), rng);
  const second = placeChild(
    first.slots,
    first.slot,
    () => newChild(parent, size, first.rng, 'y'),
    first.rng,
  );
  return { slots: second.slots, rng: second.rng };
};

/**
 * A rock hit by a shot [P $75EC, $6B47]: a large rock leaves two medium ones, a medium two small
 * ones, a small one nothing. The rock itself becomes an explosion.
 */
export const splitRock = (slots: readonly RockSlot[], index: number, rng: Rng): SplitResult => {
  const parent = slots[index];
  if (parent?.kind !== 'rock') return { slots, rng };
  const size = parent.size >> 1;
  // The children are placed while the parent still holds its slot, so they cannot take it.
  const children =
    size === 0 ? { slots, rng } : placeChildren(slots, parent, size as RockSize, rng);
  const explosion: RockSlot = {
    kind: 'explosion',
    position: parent.position,
    status: EXPLOSION_START,
  };
  return {
    slots: children.slots.map((slot, i) => (i === index ? explosion : slot)),
    rng: children.rng,
  };
};
