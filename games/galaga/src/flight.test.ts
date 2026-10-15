import { describe, expect, it } from 'vitest';
import { newSlot } from './flight-slot';
import { runFlights, SLOT_COUNT, type FlightInputs, type FlightWorld } from './flight';
import { initialFormation } from './formation';
import { DISPOSITION, emptyObjects, objectAt, updateObject } from './objects';

/** Flight inputs of a quiet first stage. */
const inputs = (frame: number): FlightInputs => ({
  frame,
  fighterX: 0x7a,
  continuousBombing: false,
  rescueRunning: false,
  harderEntries: false,
  harderAttacks: false,
  bombEnableBits: 0,
  bombInterval: 0x14,
  bombsAllowed: false,
  formation: initialFormation(),
  bonusBeeLook: 0x1b,
});

/** A bee entering from the top left on the first stage's first program. */
const entering = (): FlightWorld => ({
  slots: Array.from({ length: SLOT_COUNT }, (_, i) =>
    i === 0
      ? newSlot({ object: 0x08, y: 0x9b << 8, x: 0x34 << 8, angle: 0x300, pointer: 0x001d })
      : undefined,
  ),
  objects: updateObject(emptyObjects(), 0x08, (o) => ({
    ...o,
    disposition: DISPOSITION.entering,
    code: 0x18,
    color: 3,
  })),
  bombDrift: Array.from({ length: 8 }, () => ({ rate: 0, accumulator: 0 })),
  events: [],
});

describe('runFlights', () => {
  it('flies an entering bee into its place in the formation', () => {
    let world = entering();
    let frame = 0;
    while (world.slots[0] !== undefined && frame < 1000) {
      world = runFlights(world, inputs(frame));
      frame += 1;
    }
    const bee = objectAt(world.objects, 0x08);
    expect(frame).toBeLessThan(1000);
    expect(bee.disposition).toBe(DISPOSITION.rotating);
    // Column 0 of the grid is at x = $31, row 4 (the upper bee row) at sprite y 116.
    expect(Math.abs(bee.x - 0x31)).toBeLessThanOrEqual(1);
    expect(Math.abs(bee.y - 116)).toBeLessThanOrEqual(2);
  });

  it('moves the sprite of a flying alien along the screen', () => {
    const world = runFlights(runFlights(entering(), inputs(0)), inputs(1));
    const bee = objectAt(world.objects, 0x08);
    expect(bee.x).toBeGreaterThan(0);
    expect(bee.y).toBeGreaterThan(0);
  });
});
